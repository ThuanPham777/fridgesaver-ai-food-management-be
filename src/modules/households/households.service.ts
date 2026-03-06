// src/modules/households/households.service.ts
// Business logic for household management

import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

import { PrismaService } from '../../core/prisma';
import {
  BusinessException,
  ForbiddenException,
  NotFoundException,
} from '../../common/exceptions';
import { ERROR_CODES } from '../../common/constants';

import { CreateHouseholdDto, UpdateHouseholdDto } from './dto';

/** Invite token length in bytes (→ 64 hex chars) */
const INVITE_TOKEN_BYTES = 32;
/** Default invite link validity: 7 days */
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class HouseholdsService {
  private readonly logger = new Logger(HouseholdsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Create household ────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateHouseholdDto) {
    const household = await this.prisma.household.create({
      data: {
        name: dto.name,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
    });

    this.logger.log(`Household created: ${household.id} by user ${userId}`);
    return this.findOneWithMembers(household.id);
  }

  // ─── Create invite link (admin only) ──────────────────────────────────────

  async createInvite(householdId: string, userId: string) {
    await this.assertAdmin(householdId, userId);

    const token = crypto.randomBytes(INVITE_TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

    await this.prisma.householdInvite.create({
      data: {
        householdId,
        token,
        createdBy: userId,
        expiresAt,
      },
    });

    this.logger.log(
      `Invite created for household ${householdId} by user ${userId}`,
    );
    return this.findOneWithMembers(householdId);
  }

  // ─── Join by invite token ────────────────────────────────────────────────────

  async joinByToken(userId: string, token: string) {
    const invite = await this.prisma.householdInvite.findUnique({
      where: { token },
      include: {
        household: {
          select: { id: true, name: true },
        },
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite');
    }

    if (invite.expiresAt < new Date()) {
      throw new BusinessException(
        'Link mời đã hết hạn',
        ERROR_CODES.INVALID_OPERATION,
      );
    }

    // Already a member → return household without joining again
    const existingMember = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId: invite.householdId,
          userId,
        },
      },
    });

    if (existingMember) {
      return {
        alreadyMember: true,
        household: await this.findOneWithMembers(invite.householdId),
      };
    }

    // Join household (invite stays reusable until it expires)
    await this.prisma.householdMember.create({
      data: {
        householdId: invite.householdId,
        userId,
        role: 'member',
      },
    });

    const result = await this.findOneWithMembers(invite.householdId);
    this.logger.log(
      `User ${userId} joined household ${invite.householdId} via invite ${invite.id}`,
    );
    return { alreadyMember: false, household: result };
  }

  // ─── List households for a user ─────────────────────────────────────────────

  async findAllByUser(userId: string) {
    const memberships = await this.prisma.householdMember.findMany({
      where: { userId },
      include: {
        household: {
          include: {
            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: { joinedAt: 'asc' },
            },
            invites: {
              where: {
                usedAt: null,
                expiresAt: { gt: new Date() },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                token: true,
                expiresAt: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => {
      const { invites, ...rest } = m.household;
      return { ...rest, activeInvite: invites[0] ?? null };
    });
  }

  // ─── Get household detail ────────────────────────────────────────────────────

  async findOne(householdId: string, userId: string) {
    await this.assertMember(householdId, userId);
    return this.findOneWithMembers(householdId);
  }

  // ─── Update household name ──────────────────────────────────────────────────

  async update(householdId: string, userId: string, dto: UpdateHouseholdDto) {
    await this.assertAdmin(householdId, userId);

    await this.prisma.household.update({
      where: { id: householdId },
      data: { name: dto.name },
    });

    this.logger.log(`Household ${householdId} updated by user ${userId}`);
    return this.findOneWithMembers(householdId);
  }

  // ─── Remove member (kick) ───────────────────────────────────────────────────

  async removeMember(
    householdId: string,
    targetUserId: string,
    currentUserId: string,
  ) {
    await this.assertAdmin(householdId, currentUserId);

    if (targetUserId === currentUserId) {
      throw new BusinessException(
        'Không thể tự xóa mình khỏi hộ gia đình',
        ERROR_CODES.INVALID_OPERATION,
      );
    }

    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      select: { ownerId: true },
    });

    if (household?.ownerId === targetUserId) {
      throw new ForbiddenException('Không thể xóa chủ sở hữu khỏi hộ gia đình');
    }

    const member = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: {
          householdId,
          userId: targetUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Thành viên');
    }

    await this.prisma.householdMember.delete({
      where: { id: member.id },
    });

    this.logger.log(
      `User ${targetUserId} removed from household ${householdId} by ${currentUserId}`,
    );
    return this.findOneWithMembers(householdId);
  }

  // ─── Delete household ───────────────────────────────────────────────────────

  async remove(householdId: string, userId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      select: { ownerId: true },
    });

    if (!household) {
      throw new NotFoundException('Household', householdId);
    }

    if (household.ownerId !== userId) {
      throw new ForbiddenException('Chỉ chủ sở hữu mới có thể xóa hộ gia đình');
    }

    await this.prisma.household.delete({
      where: { id: householdId },
    });

    this.logger.log(`Household ${householdId} deleted by owner ${userId}`);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async findOneWithMembers(householdId: string) {
    const household = await this.prisma.household.findUnique({
      where: { id: householdId },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        invites: {
          where: {
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            token: true,
            expiresAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!household) {
      throw new NotFoundException('Household', householdId);
    }

    // Flatten: expose single activeInvite instead of array
    const { invites, ...rest } = household;
    return { ...rest, activeInvite: invites[0] ?? null };
  }

  private async assertMember(householdId: string, userId: string) {
    const member = await this.prisma.householdMember.findUnique({
      where: {
        householdId_userId: { householdId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException(
        'Bạn không phải thành viên của hộ gia đình này',
      );
    }

    return member;
  }

  private async assertAdmin(householdId: string, userId: string) {
    const member = await this.assertMember(householdId, userId);

    if (member.role !== 'admin') {
      throw new ForbiddenException(
        'Chỉ admin mới có quyền thực hiện thao tác này',
      );
    }

    return member;
  }
}
