const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'WebDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add ClipboardCheck to lucide-react imports
if (!content.includes('ClipboardCheck')) {
  content = content.replace(/Camera\s*\n}\s*from\s*'lucide-react';/, "Camera, ClipboardCheck\n} from 'lucide-react';");
}

// 2. Add State Hooks
const stateHook = `
  // Daily Checklists State
  const [weeklyChecklists, setWeeklyChecklists] = useState({
    'Monday': { cleanliness: false, tools: false, ppe: false, materials: false, reporting: false },
    'Tuesday': { cleanliness: false, tools: false, ppe: false, materials: false, reporting: false },
    'Wednesday': { cleanliness: false, tools: false, ppe: false, materials: false, reporting: false },
    'Thursday': { cleanliness: false, tools: false, ppe: false, materials: false, reporting: false },
    'Friday': { cleanliness: false, tools: false, ppe: false, materials: false, reporting: false },
    'Saturday': { cleanliness: false, tools: false, ppe: false, materials: false, reporting: false },
    'Sunday': { cleanliness: false, tools: false, ppe: false, materials: false, reporting: false }
  });
  const [weeklySignOff, setWeeklySignOff] = useState(false);
`;
if (!content.includes('const [weeklyChecklists')) {
  content = content.replace(/(const \[accountingSubTab.*?;\n)/, `$1${stateHook}`);
}

// 3. QRE Sidebar Button
const qreSidebar = `
                <button 
                  onClick={() => setActiveTab('daily-checklists')}
                  className={\`w-full h-12 px-4 rounded-xl font-bold text-[13.5px] transition-all cursor-pointer flex items-center justify-between border \${
                    activeTab === 'daily-checklists' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' 
                      : 'bg-surface-elevated text-text-secondary hover:bg-surface-elevated hover:text-text-primary border-border-subtle hover:border-border-subtle'
                  }\`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-4.5 h-4.5 text-[#3B82F6]" />
                    <span>Daily Checklists</span>
                  </div>
                  {activeTab === 'daily-checklists' && <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></div>}
                </button>
`;
if (!content.includes("ClipboardCheck className=") && content.includes("userRole === 'qre'")) {
    // regex not used anymore
    // Wait, regex might fail if spaces don't match. 
    // It's safer to just split and join.
}

// Better replacing for QRE
if (content.includes("<span>My Hours & Expenses</span>")) {
  let parts = content.split("<span>My Hours & Expenses</span>");
  let secondHalf = parts[1];
  let buttonEnd = secondHalf.indexOf("</button>") + "</button>".length;
  let qreTarget = secondHalf.substring(0, buttonEnd);
  
  if (!qreTarget.includes("ClipboardCheck className=")) {
    let replacedPart = qreTarget + "\\n" + qreSidebar;
    content = parts[0] + "<span>My Hours & Expenses</span>" + replacedPart + secondHalf.substring(buttonEnd);
  }
}

// 4. Admin Sidebar Button
// Let's insert after <span>Shift Summaries Log</span>
if (content.includes("<span>Shift Summaries Log</span>")) {
  let parts = content.split("<span>Shift Summaries Log</span>");
  let secondHalf = parts[1];
  let buttonEnd = secondHalf.indexOf("</button>") + "</button>".length;
  let adminTarget = secondHalf.substring(0, buttonEnd);
  
  if (!adminTarget.includes("ClipboardCheck className=")) {
    let replacedPart = adminTarget + "\\n" + qreSidebar;
    content = parts[0] + "<span>Shift Summaries Log</span>" + replacedPart + secondHalf.substring(buttonEnd);
  }
}

// 5. JSX Tab Content
const tabContent = `
          {/* DAILY CHECKLISTS TAB */}
          {activeTab === 'daily-checklists' && (
            <div className="flex-1 flex flex-col gap-3 min-h-0 bg-surface rounded-xl border border-border-subtle p-6 overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
                <div>
                  <h3 className="text-xl font-bold text-text-primary">Weekly REP Activities Report</h3>
                  <span className="text-sm text-text-secondary">Mandatory 5-point daily checklist for shift workers</span>
                </div>
                {weeklySignOff ? (
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg font-bold border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Signed Off</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      const allChecked = Object.values(weeklyChecklists).some(day => 
                        Object.values(day).some(val => val)
                      );
                      if (allChecked) {
                        setWeeklySignOff(true);
                      } else {
                        alert('Please check off at least some activities before signing off.');
                      }
                    }}
                    className="bg-[#3B82F6] hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
                  >
                    <ClipboardCheck className="w-4.5 h-4.5" />
                    <span>Sign Off Weekly Report</span>
                  </button>
                )}
              </div>
              
              <div className="overflow-x-auto w-full mt-4">
                <table className="w-full text-left border-collapse border border-border-subtle rounded-xl overflow-hidden shadow-sm text-[13.5px]">
                  <thead>
                    <tr className="bg-surface-elevated text-text-secondary">
                      <th className="p-3 border-b border-border-subtle font-semibold w-1/3">Checklist Item</th>
                      {Object.keys(weeklyChecklists).map(day => (
                        <th key={day} className="p-3 border-b border-l border-border-subtle font-semibold text-center">{day.substring(0,3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'cleanliness', label: '1. Area Cleanliness Maintained' },
                      { key: 'tools', label: '2. Tools & Scanners Calibrated' },
                      { key: 'ppe', label: '3. Mandatory PPE Worn' },
                      { key: 'materials', label: '4. Materials Stocked for Next Shift' },
                      { key: 'reporting', label: '5. End-of-Day Defect Reporting Done' }
                    ].map((item, idx) => (
                      <tr key={item.key} className={idx % 2 === 0 ? 'bg-surface' : 'bg-surface-elevated/30'}>
                        <td className="p-3 border-b border-border-subtle font-bold text-text-primary">
                          {item.label}
                        </td>
                        {Object.entries(weeklyChecklists).map(([day, checks]) => (
                          <td key={day} className="p-3 border-b border-l border-border-subtle text-center">
                            <input 
                              type="checkbox" 
                              checked={checks[item.key]}
                              disabled={weeklySignOff}
                              onChange={(e) => {
                                setWeeklyChecklists(prev => ({
                                  ...prev,
                                  [day]: {
                                    ...prev[day],
                                    [item.key]: e.target.checked
                                  }
                                }));
                              }}
                              className="w-4.5 h-4.5 cursor-pointer accent-[#3B82F6]"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Progress Bar */}
              <div className="mt-8 bg-surface-elevated p-5 rounded-xl border border-border-subtle">
                <h4 className="font-bold text-text-primary mb-4 text-[14.5px]">Weekly Completion Progress</h4>
                {(() => {
                  const totalItems = 7 * 5; // 7 days * 5 items
                  const completedItems = Object.values(weeklyChecklists).reduce((acc, day) => 
                    acc + Object.values(day).filter(v => v).length, 0
                  );
                  const progress = Math.round((completedItems / totalItems) * 100);
                  return (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between text-[13.5px] text-text-secondary font-bold">
                        <span>{completedItems} / {totalItems} Activities Checked</span>
                        <span className="text-emerald-600">{progress}%</span>
                      </div>
                      <div className="w-full h-3.5 bg-border-subtle rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500 relative overflow-hidden" 
                          style={{ width: progress + '%' }}
                        >
                          <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)' }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
`;
if (!content.includes("activeTab === 'daily-checklists' && (")) {
    const insertionPoint = "{/* TAB 2: SUPPLIERS DIRECTORY */}";
    content = content.replace(insertionPoint, `${tabContent}\n\n          ${insertionPoint}`);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Phase 6 successfully injected into WebDashboard.jsx');
