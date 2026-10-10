import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import Dashboard from "@/pages/Dashboard";
import DatasetPage from "@/pages/DatasetPage";
import EDAPage from "@/pages/EDAPage";
import VisualizationsPage from "@/pages/VisualizationsPage";
import StatisticsPage from "@/pages/StatisticsPage";
import CorrelationPage from "@/pages/CorrelationPage";
import CategoricalPage from "@/pages/CategoricalPage";
import ScoutingBriefPage from "@/pages/ScoutingBriefPage";
import ExplorerPage from "@/pages/ExplorerPage";
import AboutPage from "@/pages/AboutPage";
import ComparePage from "@/pages/ComparePage";
import ValuePredictorPage from "@/pages/ValuePredictorPage";
import NationMapPage from "@/pages/NationMapPage";
import { CompareProvider } from "@/context/CompareContext";
import CompareDrawer from "@/components/CompareDrawer";

function App() {
  return (
    <div className="min-h-screen flex flex-col" data-testid="app-root">
      <BrowserRouter>
        <CompareProvider>
        <Navbar />
        <main className="flex-1 pt-20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/value" element={<ValuePredictorPage />} />
            <Route path="/nations" element={<NationMapPage />} />
            <Route path="/dataset" element={<DatasetPage />} />
            <Route path="/eda" element={<EDAPage />} />
            <Route path="/visualizations" element={<VisualizationsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/correlation" element={<CorrelationPage />} />
            <Route path="/categorical" element={<CategoricalPage />} />
            <Route path="/scouting" element={<ScoutingBriefPage />} />
            <Route path="/explorer" element={<ExplorerPage />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </main>
        <Footer />
        <CompareDrawer />
        </CompareProvider>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </div>
  );
}

export default App;
