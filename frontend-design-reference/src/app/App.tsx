import { AppLayout } from "./components/layout/AppLayout";
import { DemoContent } from "./components/layout/DemoContent";

export default function App() {
  return (
    <AppLayout defaultRole="ADMIN" defaultPath="/">
      <DemoContent />
    </AppLayout>
  );
}
