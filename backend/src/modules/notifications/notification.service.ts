import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class NotificationService {
  async create(data: { userType: string; userId: string; title: string; message: string }) {
    return prisma.notification.create({ data });
  }
  async getForUser(userType: string, userId: string) {
    return prisma.notification.findMany({
      where: { userType, userId },
      orderBy: { createdAt: 'desc' },
    });
  }
  async markAsRead(id: string) {
    return prisma.notification.update({ where: { id }, data: { isRead: true } });
  }
  async getUnreadCount(userType: string, userId: string) {
    return prisma.notification.count({ where: { userType, userId, isRead: false } });
  }
}