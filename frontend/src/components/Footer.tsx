export default function Footer() {
  return (
    <footer className="text-center bg-gray-800 text-white">
      <div className="container mx-auto py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">SCSP Hackathon 2025</span>
        </div>
        <div className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} All rights reserved.
        </div>
      </div>
    </footer>
  );
}
