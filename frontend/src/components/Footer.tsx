export default function Footer() {
  return (
    <footer className="text-center bg-gray-800">
      <div className="py-2 flex flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2 border-r-2 pr-2">
          <span className="font-semibold text-lg">SCSP Hackathon 2025</span>
        </div>
        <div className="flex items-center gap-2 border-r-2 pr-2">
          <span>Eugene Kim</span>
        </div>
        <div className="flex items-center gap-2">
          <span>CraniumAI</span>
        </div>
      </div>
    </footer>
  );
}
