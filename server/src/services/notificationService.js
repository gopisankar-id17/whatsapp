// Notification service to handle Socket.io events from controllers
class NotificationService {
  constructor() {
    this.io = null;
  }

  // Initialize with Socket.io instance
  init(io) {
    this.io = io;
  }

  // Send notification to a specific user
  notifyUser(userId, event, data) {
    if (this.io) {
      this.io.to(userId).emit(event, data);
    }
  }

  // Send notification to multiple users
  notifyUsers(userIds, event, data) {
    if (this.io && Array.isArray(userIds)) {
      userIds.forEach(userId => {
        this.io.to(userId).emit(event, data);
      });
    }
  }

  // Broadcast to all connected clients
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Send notification to a room
  notifyRoom(roomId, event, data) {
    if (this.io) {
      this.io.to(roomId).emit(event, data);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;