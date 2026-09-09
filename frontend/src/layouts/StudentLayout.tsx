const StudentLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div className="w-full max-w-lg">{children}</div>
  </div>
);

export default StudentLayout;