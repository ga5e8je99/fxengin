import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactMessageDto, UpdateContactStatusDto } from './dto/contact.dto';
import { MessageStatus } from '@prisma/client';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactMessageDto) {
    const created = await this.prisma.contactMessage.create({
      data: {
        fullName: (dto.fullName || dto.name || 'عميل').trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        topic: dto.topic?.trim() || 'support',
        subject: dto.subject?.trim() || null,
        message: dto.message.trim(),
        status: MessageStatus.UNREAD,
      },
    });

    return {
      success: true,
      message: 'تم استلام رسالتك بنجاح، سيقوم فريق الدعم بالتواصل معك قريباً.',
      data: { id: created.id, createdAt: created.createdAt },
    };
  }

  async findAll(query?: { status?: string; search?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (query?.status && query.status !== 'ALL') {
      where.status = query.status as MessageStatus;
    }
    if (query?.search) {
      const q = query.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
      ];
    }

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, unreadCount, data] = await Promise.all([
      this.prisma.contactMessage.count({ where }),
      this.prisma.contactMessage.count({ where: { status: MessageStatus.UNREAD } }),
      this.prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      success: true,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Message ${id} not found`);
    return item;
  }

  async updateStatus(id: string, dto: UpdateContactStatusDto) {
    await this.findOne(id);
    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.replyNote !== undefined && { replyNote: dto.replyNote }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.contactMessage.delete({ where: { id } });
    return { success: true, message: 'تم حذف الرسالة بنجاح' };
  }
}
