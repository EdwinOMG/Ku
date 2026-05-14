import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import kuRoutes from './routes/kus'
import followRoutes from './routes/follows'
import likeRoutes from './routes/likes'
import commentRoutes from './routes/comments'
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


dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app