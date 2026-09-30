// creating reply notification =>
import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { getUserfromClerk } from '../modules/users/user.service'
let io: Server | null = null

const onlineUsers = new Map<number, Set<string>>()
function addOnlineUsers(rawUserId: unknown, socketId: string) {
  const userId = Number(rawUserId)
  if (!Number.isFinite(userId) || userId <= 0) {
    return
  }
  const existingUSer = onlineUsers.get(userId)
  if (existingUSer) {
    existingUSer.add(socketId)
  } else {
    onlineUsers.set(userId, new Set([socketId]))
  }
}
function removeOnlineUsers(rawUserId: unknown, socketId: string) {
  const userId = Number(rawUserId)
  if (!Number.isFinite(userId) || userId <= 0) {
    return
  }
  const existing = onlineUsers.get(userId)
  if (!existing) return
  existing.delete(socketId)
  if (existing.size === 0) {
    onlineUsers.delete(userId)
  }
}

// initial function to start the socket function =>
export function initIo(httpServer: HttpServer) {
  if (io) return io //safeguard => only create once
  // now creating the socketIo server =>
  io = new Server(httpServer, {
    cors: { origin: 'http://localhost:3000', credentials: true },
  })
  io.on('connection', async socket => {
    console.log(`[io connection] ------> ${socket.id}`)
    try {
      const clerkUserId = socket.handshake.auth?.userId
      if (!clerkUserId || typeof clerkUserId !== 'string') {
        console.log(`[Missing clerk user id] -----> ${socket.id}`)
        // immediately disconnecting from the server ->
        socket.disconnect(true)
        return
      }
      const profile = await getUserfromClerk(clerkUserId)
      const rawLocalUserId = profile.user.id
      const localUserId = Number(rawLocalUserId)
      if (!Number.isFinite(localUserId) || localUserId <= 0) {
        console.log(`[Invalid user id] -----> ${socket.id}`)
        socket.disconnect(true)
        return
      }
      ;(socket.data as { userId: number }) = {
        userId: localUserId,
      }
      // creating the notification room =>
      const notiRoom = `notifications:user:${localUserId}`
      socket.join(notiRoom)
      addOnlineUsers(localUserId, socket.id)
      broadCastPresence()
    } catch (error) {
      console.error(`Error while connecting to the socket server: ${error}`)
      socket.disconnect(true)
    }
  })
}

function broadCastPresence() {
  io?.emit('presence:update', { onlineUsersIds: onlineUsers })
}
function getOnlineUsersIds(): number[] {
  return Array.from(onlineUsers.keys())
}

export function getIo() {
  return io
}
