// app/layout.js
import { Providers } from './providers';
import 'stream-chat-react/dist/css/v2/index.css';
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}