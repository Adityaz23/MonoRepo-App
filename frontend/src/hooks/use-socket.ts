'use client'
import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
type UseSocketResult = {
  socket: Socket | null
  connected: boolean
}
export function useSocket(): UseSocketResult {
  const { userId, isLoaded } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    if (!isLoaded) return
    if (!userId) {
      setConnected(false)
      setSocket(prev => {
        if (prev) {
          prev.disconnect
        }
        return null
      })
      return
    }
    const baseUrl = 'http://localhost:5002/'
    console.log(`[Socket],${baseUrl}, ${userId}`)
    const socketInstance: Socket = io(baseUrl, {
      auth: { userId }, //backend is going to read the userId
      withCredentials: true,
      transports: ['websocket'],
    })
    setSocket(socketInstance)
    const handleConnect = () => {
      setConnected(true)
      console.log(`[Socket],${socketInstance.id}`)
    }
    const handleDisconnect = (reason: any) => {
      setConnected(false)
      console.log(`[Socket],${socketInstance.id},${reason}`)
    }
    const handleConnectedError = (err: any) => {
      console.error(`Error ${err}`)
    }
    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)
    socketInstance.on('Connect_Error', handleConnectedError)
    return () => {
      socketInstance.off('connect', handleConnect)
      socketInstance.off('disconnect', handleDisconnect)
      socketInstance.off('Connect_Error', handleConnectedError)
      socketInstance.disconnect()
      setConnected(false)
      setSocket(null)
    }
  }, [userId, isLoaded])
  return { socket, connected }
}
