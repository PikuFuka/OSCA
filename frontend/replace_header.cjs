const fs = require('fs');
const file = 'c:/Users/Rolan Sotomayor/Desktop/OSCA/frontend/components/Header.tsx';
let content = fs.readFileSync(file, 'utf8');
const startIdx = content.indexOf('      {/* Right Section: Utilities & Profile */}');
const endIdx = content.indexOf('      {/* Settings Modal */}');

if (startIdx !== -1 && endIdx !== -1) {
  const newContent = content.substring(0, startIdx) + `      {/* Right Section: Utilities & Profile */}
      <div className="flex items-center gap-4 shrink-0" ref={menuRef}>
        
        {/* Utilities */}
        <div className="flex items-center gap-3">
          {/* Primary CTA */}
          {['Admin', 'Staff'].includes(currentUser.role) && (
            <button 
              onClick={() => setView && setView(ViewType.ADD_MEMBER)}
              className="hidden lg:flex items-center gap-2 bg-teal-deep text-white px-4 py-2 rounded-modern font-semibold text-[13px] hover:bg-[#153434] transition-colors shadow-sm"
            >
              <UserPlus size={16} /> New Senior
            </button>
          )}

          {/* Online Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-mint-soft/20 text-teal-deep rounded-full border border-mint-soft/50 font-bold text-[11px] tracking-wide">
             <div className="w-2 h-2 rounded-full bg-teal-deep animate-pulse"></div>
             ONLINE
          </div>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>

        {/* Admin Profile */}
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 p-1.5 pr-4 rounded-[16px]">
                <div className="h-9 w-9 bg-slate-600 text-white rounded-full flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm font-bold text-sm">
                   {currentUser.idPhoto ? (
                     <img src={currentUser.idPhoto} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     currentUser.name.charAt(0)
                   )}
                </div>
                <div className="hidden md:flex items-center gap-2">
                   <span className="text-[13px] font-bold text-slate-800 leading-none">{currentUser.name}</span>
                   <span className="text-[10px] font-bold text-[#8c8273] bg-[#f4f1eb] px-2 py-0.5 rounded-md uppercase tracking-widest leading-none">
                     {currentUser.role}
                   </span>
                </div>
            </div>

            {/* Logout Button */}
            <button 
              onClick={onLogout}
              className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut size={20} strokeWidth={2.5} />
            </button>
        </div>
      </div>\n\n` + content.substring(endIdx);
  fs.writeFileSync(file, newContent);
  console.log('Success');
} else {
  console.log('Tags not found');
}
