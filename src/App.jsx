import NexoraLanding from "./components/NexoraDataLanding.jsx";
import useMetaPixelPageView from "./hooks/useMetaPixelPageView";

export default function App() {
  useMetaPixelPageView();
  return <NexoraLanding />;
}
