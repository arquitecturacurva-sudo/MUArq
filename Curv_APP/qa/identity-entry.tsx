import { createRoot } from 'react-dom/client';
import { IdentityPreview } from './identity-preview';

const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<IdentityPreview />);
