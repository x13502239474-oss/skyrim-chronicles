import { useEffect } from 'react'
import { Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import Home from '@/pages/Home'
import WorldPage from '@/pages/WorldPage'
import TravelPage from '@/pages/TravelPage'
import HoldsPage from '@/pages/HoldsPage'
import RegionPage from '@/pages/RegionPage'
import CityPage from '@/pages/CityPage'
import LocationPage from '@/pages/LocationPage'
import ProfilePage from '@/pages/ProfilePage'
import QuestsPage from '@/pages/QuestsPage'
import CharactersPage from '@/pages/CharactersPage'
import FactionsPage from '@/pages/FactionsPage'
import CollectionsPage from '@/pages/CollectionsPage'
import JournalPage from '@/pages/JournalPage'
import ArchivePage from '@/pages/ArchivePage'
import NotFound from '@/pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          element={
            <Layout>
              <Outlet />
            </Layout>
          }
        >
          <Route index element={<Home />} />
          <Route path="world" element={<WorldPage />} />
          <Route path="travel" element={<TravelPage />} />
          <Route path="holds" element={<HoldsPage />} />
          <Route path="region/:regionId" element={<RegionPage />} />
          <Route path="city/:cityId" element={<CityPage />} />
          <Route path="location/:locationId" element={<LocationPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="quests" element={<QuestsPage />} />
          <Route path="characters" element={<CharactersPage />} />
          <Route path="factions" element={<FactionsPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
