import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import kuRoutes from './routes/kus'
import followRoutes from './routes/follows'
import likeRoutes from './routes/likes'
import commentRoutes from './routes/comments'
import collectionRoutes from './routes/collections'
import hashtagRoutes from './routes/hashtags'
import reportRoutes from './routes/reports'
import wordFilterRoutes from './routes/wordfilter'
import searchRoutes from './routes/search'
import openWriteRoutes from './routes/openwrites'
import promptRoutes from './routes/prompts'
import notificationRoutes from './routes/notifications'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://ku-three.vercel.app',
    'https://ku-git-dev-edwindoescoding.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json({ limit: '10mb' }))

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/kus', kuRoutes)
app.use('/follows', followRoutes)
app.use('/likes', likeRoutes)
app.use('/comments', commentRoutes)
app.use('/collections', collectionRoutes)
app.use('/hashtags', hashtagRoutes)
app.use('/reports', reportRoutes)
app.use('/wordfilter', wordFilterRoutes)
app.use('/search', searchRoutes)
app.use('/openwrites', openWriteRoutes)
app.use('/prompts', promptRoutes)
app.use('/notifications', notificationRoutes)


app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app