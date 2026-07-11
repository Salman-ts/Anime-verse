// AnimeChan API — Anime Quotes
// https://animechan.io/docs
const ANIMECHAN_BASE = 'https://animechan.io/api/v1'

export interface AnimeQuote {
  content: string
  anime: { name: string }
  character: { name: string }
}

const quoteFetch = async (endpoint: string) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)
  
  try {
    const res = await fetch(`${ANIMECHAN_BASE}${endpoint}`, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!res.ok) throw new Error(`AnimeChan ${res.status}`)
    return await res.json()
  } catch (err: any) {
    clearTimeout(timeoutId)
    throw err
  }
}

// Curated fallback quotes for offline/rate-limit scenarios
const FALLBACK_QUOTES: AnimeQuote[] = [
  { content: "People's lives don't end when they die. It ends when they lose faith.", anime: { name: "Naruto" }, character: { name: "Itachi Uchiha" } },
  { content: "The world isn't perfect. But it's there for us, doing the best it can.", anime: { name: "Fullmetal Alchemist" }, character: { name: "Roy Mustang" } },
  { content: "If you don't take risks, you can't create a future.", anime: { name: "One Piece" }, character: { name: "Monkey D. Luffy" } },
  { content: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", anime: { name: "Fullmetal Alchemist" }, character: { name: "Kimimaro" } },
  { content: "Fear is not evil. It tells you what your weakness is.", anime: { name: "Fairy Tail" }, character: { name: "Gildarts Clive" } },
  { content: "The moment you think of giving up, think of the reason why you held on so long.", anime: { name: "Naruto" }, character: { name: "Naruto Uzumaki" } },
  { content: "A lesson without pain is meaningless. That's because no one can gain without sacrificing something.", anime: { name: "Fullmetal Alchemist: Brotherhood" }, character: { name: "Edward Elric" } },
  { content: "It's not the face that makes someone a monster; it's the choices they make with their lives.", anime: { name: "Naruto" }, character: { name: "Naruto Uzumaki" } },
]

export const animechanApi = {
  async getRandomQuotes(count = 5): Promise<AnimeQuote[]> {
    try {
      const data = await quoteFetch(`/quotes/random/${count}`)
      return Array.isArray(data) ? data : (data.data || FALLBACK_QUOTES.slice(0, count))
    } catch (err) {
      console.warn('AnimeChan API unavailable, using fallback quotes:', err)
      return FALLBACK_QUOTES.slice(0, count)
    }
  },

  async getQuotesByAnime(title: string): Promise<AnimeQuote[]> {
    try {
      const data = await quoteFetch(`/quotes?anime=${encodeURIComponent(title)}`)
      const quotes = Array.isArray(data) ? data : (data.data || [])
      return quotes.length > 0 ? quotes.slice(0, 3) : FALLBACK_QUOTES.slice(0, 2)
    } catch (err) {
      console.warn('AnimeChan search failed, using fallback:', err)
      return FALLBACK_QUOTES.slice(0, 2)
    }
  }
}
