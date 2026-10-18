import { getHealthNews } from '../lib/news'
import { useAsync } from '../hooks/useAsync'
import { NewsCard } from '../components/NewsSlideshow'
import { InfoNote, Skeleton, TopBar } from '../components/ui'

export default function News() {
  const news = useAsync(() => getHealthNews(), [])
  return (
    <div className="pb-8">
      <TopBar title="Health News" />
      <div className="space-y-3 px-5">
        {news.loading
          ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[132px]" />)
          : news.data.items.map((item) => <NewsCard key={item.id} item={item} />)}
      </div>
      {news.data && (
        <InfoNote className="mx-5 mt-5">
          {news.data.live
            ? 'Live headlines from Kemenkes RI (Sehat Negeriku) and the World Health Organization. Tap a card to read the full article on their site.'
            : 'Showing MediMeet health tips. Live headlines from Kemenkes RI and WHO appear once the Supabase backend is connected.'}
        </InfoNote>
      )}
    </div>
  )
}
