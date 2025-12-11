'use client';
 
export default function NotFound() {
  return (
    <html>
      <body className="text-center p-10 font-sans">
        <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="mb-4">The page you are looking for does not exist.</p>
        <a href="/" className="text-blue-500 hover:underline">Go back home</a>
      </body>
    </html>
  );
}

