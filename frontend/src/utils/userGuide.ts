export const userGuideHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>SUAMP - User Guide</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      padding: 40px; 
      max-width: 900px; 
      margin: 0 auto; 
      line-height: 1.7; 
      color: #1e293b; 
      background: #f8fafc;
    }
    .container { background: white; padding: 50px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    h1 { 
      color: #10b981; 
      border-bottom: 3px solid #10b981; 
      padding-bottom: 15px; 
      font-size: 28px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    h2 { 
      color: #0f172a; 
      margin-top: 30px; 
      margin-bottom: 12px;
      font-size: 20px;
      border-left: 4px solid #10b981;
      padding-left: 15px;
    }
    h3 {
      color: #1e293b;
      margin-top: 20px;
      margin-bottom: 8px;
      font-size: 16px;
    }
    ul { padding-left: 25px; margin: 8px 0 12px; }
    li { margin-bottom: 6px; }
    .code { 
      background: #f1f5f9; 
      padding: 2px 10px; 
      border-radius: 4px; 
      font-family: 'Courier New', monospace; 
      font-size: 13px; 
      color: #0f172a;
      font-weight: 600;
    }
    .note { 
      background: #fefcbf; 
      padding: 15px 20px; 
      border-radius: 8px; 
      border-left: 4px solid #ecc94b; 
      margin: 15px 0; 
    }
    .warning { 
      background: #fed7d7; 
      padding: 15px 20px; 
      border-radius: 8px; 
      border-left: 4px solid #e53e3e; 
      margin: 15px 0; 
    }
    .success { 
      background: #d1fae5; 
      padding: 15px 20px; 
      border-radius: 8px; 
      border-left: 4px solid #10b981; 
      margin: 15px 0; 
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 15px 0; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0; }
    .card { 
      background: #f8fafc; 
      padding: 20px; 
      border-radius: 10px; 
      border: 1px solid #e2e8f0;
    }
    .card h4 { color: #0f172a; margin-bottom: 6px; }
    .card p { color: #64748b; font-size: 14px; }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 2px solid #e2e8f0; 
      color: #94a3b8; 
      font-size: 13px; 
      text-align: center; 
    }
    .badge {
      display: inline-block;
      padding: 2px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }
    .badge-green { background: #d1fae5; color: #065f46; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-purple { background: #ede9fe; color: #5b21b6; }
    .badge-orange { background: #fef3c7; color: #92400e; }
    .badge-red { background: #fecaca; color: #991b1b; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 15px 0;
      font-size: 14px;
    }
    th { 
      background: #f1f5f9; 
      text-align: left; 
      padding: 10px 15px; 
      border-bottom: 2px solid #e2e8f0;
      font-weight: 600;
    }
    td { padding: 10px 15px; border-bottom: 1px solid #e2e8f0; }
    tr:hover { background: #f8fafc; }
    .tech-btn {
      display: inline-block;
      background: #0f172a;
      color: white;
      padding: 10px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin-top: 10px;
      transition: background 0.2s;
    }
    .tech-btn:hover { background: #1e293b; }
    .flex-end { display: flex; justify-content: flex-end; }
    @media (max-width: 700px) {
      body { padding: 20px; }
      .container { padding: 25px; }
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="container">

  <h1>📚 SUAMP User Guide</h1>
  <p style="color: #64748b; font-size: 16px; margin-top: 5px;">
    Smart University Attendance Management Platform — Complete User Guide
  </p>

  <!-- ============================== -->
  <!-- 1. INTRODUCTION -->
  <!-- ============================== -->

  <h2>📖 1. Introduction</h2>
  <p>
    SUAMP (Smart University Attendance Management Platform) is a comprehensive, 
    multi-tenant attendance management system designed for higher education institutions. 
    It enables efficient tracking, verification, and reporting of student attendance 
    across multiple user roles.
  </p>

  <div class="grid-3">
    <div class="card">
      <h4>🎯 Purpose</h4>
      <p>Streamline attendance management across faculties, departments, and programs.</p>
    </div>
    <div class="card">
      <h4>👥 Users</h4>
      <p>University Admins, HODs, Lecturers, and Students.</p>
    </div>
    <div class="card">
      <h4>🏛️ Institutions</h4>
      <p>Multi-tenant support for multiple universities and colleges.</p>
    </div>
  </div>

  <!-- ============================== -->
  <!-- 2. GETTING STARTED -->
  <!-- ============================== -->

  <h2>🚀 2. Getting Started</h2>

  <h3>2.1 Institution Registration</h3>
  <ol style="padding-left: 25px; margin: 8px 0 12px;">
    <li>Go to <span class="code">/signup/university-admin</span></li>
    <li>Fill in institution details (type, name, email, phone, capacity)</li>
    <li>Create administrator account (full name, email, phone, password)</li>
    <li>Enter the license code provided by the Platform Administrator</li>
    <li>Click <span class="code">Submit License</span> to activate your institution</li>
  </ol>

  <div class="note">
    <strong>💡 Tip:</strong> Keep your license code safe. You'll need it for reactivation.
  </div>

  <!-- ============================== -->
  <!-- 3. USER ROLES -->
  <!-- ============================== -->

  <h2>👤 3. User Roles & Permissions</h2>

  <table>
    <thead>
      <tr>
        <th>Role</th>
        <th>Key Responsibilities</th>
        <th>Access Level</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>University Admin</strong> <span class="badge badge-green">Admin</span></td>
        <td>Manage faculties, departments, HODs, academic calendar, reports</td>
        <td>Full institution access</td>
      </tr>
      <tr>
        <td><strong>HOD</strong> <span class="badge badge-blue">HOD</span></td>
        <td>Manage lecturers, students, units, programs, attendance records</td>
        <td>Department-level access</td>
      </tr>
      <tr>
        <td><strong>Lecturer</strong> <span class="badge badge-purple">Lecturer</span></td>
        <td>Create attendance sessions, mark attendance, view reports</td>
        <td>Assigned units only</td>
      </tr>
      <tr>
        <td><strong>Student</strong> <span class="badge badge-orange">Student</span></td>
        <td>Check in via attendance links, view own attendance</td>
        <td>Self only</td>
      </tr>
    </tbody>
  </table>

  <!-- ============================== -->
  <!-- 4. UNIVERSITY ADMIN -->
  <!-- ============================== -->

  <h2>🏛️ 4. University Admin Portal</h2>

  <h3>4.1 Faculties</h3>
  <ul>
    <li><strong>Add Faculty:</strong> Click <span class="code">+ Add Faculty</span>, enter name</li>
    <li><strong>Edit/Delete:</strong> Use the action buttons next to each faculty</li>
    <li><strong>View Departments:</strong> Faculty cards show the number of departments</li>
  </ul>

  <h3>4.2 Departments</h3>
  <ul>
    <li><strong>Add Department:</strong> Click <span class="code">+ Add Department</span>, select faculty, enter name</li>
    <li><strong>View Details:</strong> Click <span class="code">View</span> to see HODs, programmes, units</li>
  </ul>

  <h3>4.3 HODs (Heads of Department)</h3>
  <ul>
    <li><strong>Add HOD:</strong> Click <span class="code">+ Add HOD</span>, fill in staff number, name, email, phone</li>
    <li><strong>Assign Department:</strong> Select the department the HOD will manage</li>
    <li><strong>Login Credentials:</strong> System auto-generates password → share with HOD</li>
    <li><strong>Edit/Deactivate/Delete:</strong> Use action buttons in the HOD list</li>
  </ul>

  <div class="note">
    <strong>🔐 Important:</strong> HOD login credentials are auto-generated. Share them securely with the HOD.
  </div>

  <h3>4.4 Academic Calendar</h3>
  <ul>
    <li><strong>Create Academic Year:</strong> Click <span class="code">+ Add Year</span>, enter name, start/end dates</li>
    <li><strong>Set Active:</strong> Click <span class="code">Activate</span> to make a year current</li>
    <li><strong>Archive/Delete:</strong> Archive old years or delete inactive ones</li>
    <li><strong>Progress Tracking:</strong> View progress bar for the active academic year</li>
  </ul>

  <h3>4.5 Reports</h3>
  <ul>
    <li><strong>Department Reports:</strong> View attendance stats per department</li>
    <li><strong>Export:</strong> Download reports in PDF or Excel format</li>
    <li><strong>Compliance Alerts:</strong> View alerts for departments without HODs</li>
  </ul>

  <h3>4.6 Technical Center</h3>
  <ul>
    <li><strong>Report Issues:</strong> Submit technical issues (title, description, severity)</li>
    <li><strong>Track Status:</strong> View issue status (OPEN, IN_PROGRESS, RESOLVED)</li>
    <li><strong>Issue Stats:</strong> View total, open, and critical issues</li>
  </ul>

  <h3>4.7 Integrations</h3>
  <ul>
    <li><strong>Standalone Mode:</strong> Manual data entry and import</li>
    <li><strong>Integrated Mode:</strong> Sync with external systems (SIS, LMS)</li>
    <li><strong>Sync Data:</strong> Students, Lecturers, Units, Programs</li>
    <li><strong>Test Connection:</strong> Verify API endpoint connectivity</li>
  </ul>

  <h3>4.8 Subscription & Licensing</h3>
  <ul>
    <li><strong>View License:</strong> See current license type, status, expiry</li>
    <li><strong>Request New License:</strong> Click <span class="code">Request New License</span> to notify Platform Admin</li>
    <li><strong>Enter License:</strong> Paste license code and click <span class="code">Activate</span></li>
    <li><strong>Upgrade:</strong> Upgrade from Trial/Subscription to Perpetual</li>
    <li><strong>Billing History:</strong> View all license activations and payments</li>
  </ul>

  <h3>4.9 Settings</h3>
  <ul>
    <li><strong>Institution Profile:</strong> Update name, email, phone, address, logo</li>
    <li><strong>Report Settings:</strong> Choose accent color for reports</li>
    <li><strong>Security:</strong> Configure password policies, auto-lock, class hours</li>
    <li><strong>Danger Zone:</strong> Request data deletion</li>
  </ul>

  <!-- ============================== -->
  <!-- 5. HOD PORTAL -->
  <!-- ============================== -->

  <h2>📋 5. HOD Portal</h2>

  <h3>5.1 Dashboard</h3>
  <ul>
    <li><strong>Stats:</strong> View lecturers, students, units, monthly classes, overall attendance</li>
    <li><strong>Attendance Overview:</strong> Monthly trend chart</li>
    <li><strong>Low Attendance Alert:</strong> Students with attendance below 75%</li>
    <li><strong>Semester Summary:</strong> Total classes, attended, missed, average rates</li>
  </ul>

  <h3>5.2 Lecturers</h3>
  <ul>
    <li><strong>Add Lecturer:</strong> Click <span class="code">+ Add Lecturer</span>, enter staff number, name, email, phone</li>
    <li><strong>Assign Units:</strong> Click <span class="code">Assign/Unassign Units</span> → select units → assign</li>
    <li><strong>View Profile:</strong> Click <span class="code">View</span> to see units, programs, attendance tracking</li>
    <li><strong>Share Credentials:</strong> Copy, WhatsApp, or Email login details</li>
  </ul>

  <h3>5.3 Students</h3>
  <ul>
    <li><strong>Add Student:</strong> Click <span class="code">+ Add Student</span>, enter regNo, name, email, program, year, semester</li>
    <li><strong>Bulk Import:</strong> Upload Excel/CSV (columns: regNo, fullName, email, program, studyYear, semester)</li>
    <li><strong>Promote:</strong> Promote students to next semester or year</li>
    <li><strong>Archive:</strong> Archive inactive students, view archived list</li>
    <li><strong>View Details:</strong> Click student to view attendance history, per-unit breakdown</li>
  </ul>

  <h3>5.4 Programs & Units</h3>
  <ul>
    <li><strong>Programs:</strong> Manage academic programs (name, code, duration)</li>
    <li><strong>Units:</strong> Manage units (name, code, program, year, semester)</li>
    <li><strong>Bulk Import Units:</strong> Upload Excel with unit details</li>
  </ul>

  <h3>5.5 Class Records</h3>
  <ul>
    <li><strong>View Sessions:</strong> View attendance sessions by lecturer, unit, or student</li>
    <li><strong>Status:</strong> See present/absent counts and percentages</li>
    <li><strong>Filter:</strong> Filter by unit, program, date range</li>
  </ul>

  <!-- ============================== -->
  <!-- 6. LECTURER PORTAL -->
  <!-- ============================== -->

  <h2>👨‍🏫 6. Lecturer Portal</h2>

  <h3>6.1 Dashboard</h3>
  <ul>
    <li><strong>Stats:</strong> Today's classes, active session, total units, avg attendance, sessions conducted</li>
    <li><strong>Quick Actions:</strong> Start Attendance, View Reports, Search Student</li>
    <li><strong>Recent Sessions:</strong> View recent attendance sessions with rates</li>
  </ul>

  <h3>6.2 My Units</h3>
  <ul>
    <li>View all units assigned to you</li>
    <li>See total students, sessions conducted, average attendance per unit</li>
  </ul>

  <h3>6.3 Start Attendance</h3>
  <ul>
    <li><strong>Select Unit:</strong> Choose the unit for the attendance session</li>
    <li><strong>Set Duration:</strong> 5, 10, 15 minutes or custom</li>
    <li><strong>Set Radius:</strong> 30, 50, 70 meters or custom (GPS verification)</li>
    <li><strong>Generate Link:</strong> Click <span class="code">GENERATE ATTENDANCE LINK</span></li>
    <li><strong>Share Link:</strong> Copy and share with students via WhatsApp, Email, or LMS</li>
  </ul>

  <div class="note">
    <strong>📍 GPS Verification:</strong> Students must be within the set radius to check in. This ensures they are physically present.
  </div>

  <h3>6.4 Live Session</h3>
  <ul>
    <li><strong>Real-time Feed:</strong> View students checking in live</li>
    <li><strong>Stats:</strong> Total, present, absent, attendance rate</li>
    <li><strong>Timer:</strong> Countdown showing remaining session time</li>
    <li><strong>End Session:</strong> Click <span class="code">End Session</span> to complete</li>
  </ul>

  <h3>6.5 History & Reports</h3>
  <ul>
    <li><strong>View Past Sessions:</strong> All completed sessions with attendance rates</li>
    <li><strong>Generate Report:</strong> PDF or Excel format for any session</li>
    <li><strong>Download:</strong> Download reports for records or submission</li>
  </ul>

  <h3>6.6 Student Search & Analytics</h3>
  <ul>
    <li><strong>Search Students:</strong> Find students by name or registration number</li>
    <li><strong>View Tracking:</strong> See individual student attendance history</li>
    <li><strong>Analytics:</strong> View charts and insights on attendance patterns</li>
  </ul>

  <!-- ============================== -->
  <!-- 7. LICENSE & SUBSCRIPTION -->
  <!-- ============================== -->

  <h2>🔑 7. License & Subscription Management</h2>

  <h3>7.1 License Types</h3>
  <div class="grid-3">
    <div class="card">
      <h4>🔬 Trial</h4>
      <p>Free 30-day trial. Full features. No payment required.</p>
    </div>
    <div class="card">
      <h4>🔄 Subscription</h4>
      <p>KES 44,850/year. Annual renewal. Full features + support.</p>
    </div>
    <div class="card">
      <h4>∞ Perpetual</h4>
      <p>KES 374,850 one-time. Lifetime access. Priority support.</p>
    </div>
  </div>

  <h3>7.2 License States</h3>
  <ul>
    <li><strong>Active:</strong> License is valid and fully operational</li>
    <li><strong>Expiring Soon:</strong> 30 days or less before expiry. Renew to avoid interruption</li>
    <li><strong>Expired:</strong> License has expired. System is in read-only mode</li>
    <li><strong>Grace Period:</strong> 14 days after expiry. Still accessible but limited</li>
    <li><strong>Revoked:</strong> License has been revoked by Platform Admin</li>
  </ul>

  <h3>7.3 License Actions</h3>
  <ul>
    <li><strong>Request New License:</strong> Notify Platform Admin to generate a new license</li>
    <li><strong>Activate License:</strong> Enter license code to activate/upgrade</li>
    <li><strong>Upgrade to Perpetual:</strong> One-time payment for lifetime access</li>
    <li><strong>View Billing History:</strong> See all license activations and payments</li>
  </ul>

  <div class="warning">
    <strong>⚠️ Expired License:</strong> When your license expires, the system becomes read-only. You can view all data but cannot create new sessions, add users, or make changes.
  </div>

  <!-- ============================== -->
  <!-- 8. ATTENDANCE PROCESS -->
  <!-- ============================== -->

  <h2>📊 8. Attendance Process Flow</h2>

  <ol style="padding-left: 25px; margin: 8px 0 12px;">
    <li><strong>Setup:</strong> HOD creates Programs → Units → Assigns Lecturers</li>
    <li><strong>Schedule:</strong> Lecturer starts attendance session → Sets duration & radius</li>
    <li><strong>Share:</strong> Lecturer shares attendance link with students</li>
    <li><strong>Check-in:</strong> Student opens link → Enters registration number</li>
    <li><strong>Verify:</strong> System validates student, session, and GPS location</li>
    <li><strong>Record:</strong> Attendance recorded with timestamp and GPS data</li>
    <li><strong>Monitor:</strong> Lecturer views live check-ins in real-time</li>
    <li><strong>Report:</strong> Attendance reports available instantly</li>
  </ol>

  <!-- ============================== -->
  <!-- 9. REPORTING -->
  <!-- ============================== -->

  <h2>📄 9. Reporting</h2>

  <h3>9.1 Report Types</h3>
  <ul>
    <li><strong>Department Reports:</strong> Attendance rates by department</li>
    <li><strong>Session Reports:</strong> Per-session attendance with student list</li>
    <li><strong>Student Reports:</strong> Individual student attendance history</li>
    <li><strong>Program Reports:</strong> Attendance rates by program</li>
  </ul>

  <h3>9.2 Export Formats</h3>
  <ul>
    <li><strong>PDF:</strong> Professional printable reports with signatures</li>
    <li><strong>Excel:</strong> Editable spreadsheets for further analysis</li>
  </ul>

  <!-- ============================== -->
  <!-- 10. FREQUENTLY ASKED QUESTIONS -->
  <!-- ============================== -->

  <h2>❓ 10. Frequently Asked Questions</h2>

  <h3>Q1: What happens when my license expires?</h3>
  <p>System enters read-only mode. You can view all data but cannot make changes or start new sessions.</p>

  <h3>Q2: How do I get a new license?</h3>
  <p>Click <span class="code">Request New License</span> on the Subscription page. Platform Admin will receive a notification and generate a new license.</p>

  <h3>Q3: How do students check in?</h3>
  <p>Students receive an attendance link from the lecturer. They open it, enter their registration number, and submit.</p>

  <h3>Q4: Can I import students in bulk?</h3>
  <p>Yes. In the HOD Students tab, click <span class="code">Import Students</span> and upload an Excel or CSV file.</p>

  <h3>Q5: What is GPS verification?</h3>
  <p>Students must be within the lecturer's set radius to check in. This prevents remote/proxy attendance.</p>

  <h3>Q6: How do I assign units to a lecturer?</h3>
  <p>In the HOD Lecturers tab, click <span class="code">View</span> → <span class="code">Manage</span> → <span class="code">Assign/Unassign Units</span>. Select units and assign.</p>

  <h3>Q7: Can I upgrade from Trial to Subscription?</h3>
  <p>Yes. In the Subscription page, click <span class="code">Subscribe Now — M-Pesa</span> and follow the payment process.</p>

  <h3>Q8: What data is stored for attendance?</h3>
  <p>Student registration number, timestamp, GPS location (if available), and session details.</p>

  <!-- ============================== -->
  <!-- 11. SUPPORT -->
  <!-- ============================== -->

  <h2>📞 11. Support & Contact</h2>

  <div class="grid-2">
    <div class="card">
      <h4>📧 Email Support</h4>
      <p><a href="mailto:support@suamp.com" style="color: #10b981;">support@suamp.com</a></p>
      <p style="font-size: 13px;">Response within 24 hours</p>
    </div>
    <div class="card">
      <h4>📞 Phone Support</h4>
      <p><strong>+254 700 000 000</strong></p>
      <p style="font-size: 13px;">Available 24/7</p>
    </div>
    <div class="card">
      <h4>💬 Live Chat</h4>
      <p>Coming soon</p>
      <p style="font-size: 13px;">Instant support</p>
    </div>
    <div class="card">
      <h4>📚 Documentation</h4>
      <p>Full documentation available</p>
      <p style="font-size: 13px;">Detailed API and user guides</p>
    </div>
  </div>

  <!-- ============================== -->
  <!-- 12. KEYBOARD SHORTCUTS -->
  <!-- ============================== -->

  <h2>⌨️ 12. Keyboard Shortcuts</h2>
  <table>
    <thead>
      <tr>
        <th>Action</th>
        <th>Shortcut</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Search</td><td><span class="code">Ctrl + K</span></td></tr>
      <tr><td>Navigate Dashboard</td><td><span class="code">Alt + 1</span></td></tr>
      <tr><td>Navigate Students</td><td><span class="code">Alt + 2</span></td></tr>
      <tr><td>Navigate Lecturers</td><td><span class="code">Alt + 3</span></td></tr>
      <tr><td>Open Notifications</td><td><span class="code">Ctrl + Shift + N</span></td></tr>
    </tbody>
  </table>

  <!-- ============================== -->
  <!-- 13. TROUBLESHOOTING -->
  <!-- ============================== -->

  <h2>🔧 13. Troubleshooting</h2>

  <div class="warning">
    <strong>⚠️ Can't log in?</strong> Check your email/password. If you've forgotten your password, contact your administrator.
  </div>

  <div class="warning">
    <strong>⚠️ Students can't check in?</strong> Ensure: (1) Session is active, (2) Student is registered for the unit, (3) Student is within GPS radius.
  </div>

  <div class="warning">
    <strong>⚠️ No units assigned?</strong> Contact your HOD to assign units to your lecturer account.
  </div>

  <div class="note">
    <strong>💡 Browser Issues:</strong> Use the latest version of Chrome, Firefox, or Edge for the best experience.
  </div>

  <!-- ============================== -->
  <!-- 14. TECHNICAL DOCUMENT -->
  <!-- ============================== -->

  <div class="flex-end">
    <a 
      href="https://github.com/ad-george/kagua-project/blob/main/README.md" 
      target="_blank" 
      rel="noopener noreferrer"
      class="tech-btn"
    >
      📄 Technical Document
    </a>
  </div>

  <!-- ============================== -->
  <!-- 15. FOOTER -->
  <!-- ============================== -->

  <div class="footer">
    <p><strong>SAMPHE v1.0</strong> — Smart Attendance Management Platform for Higher Education</p>
    <p style="margin-top: 5px;">© ${new Date().getFullYear()} SAMPHE. All rights reserved.</p>
    <p style="margin-top: 5px; font-size: 11px;">For questions or support, contact <a href="mailto:support@samphe.com" style="color: #10b981;">support@samphe.com</a></p>
  </div>

</div>
</body>
</html>
`;
