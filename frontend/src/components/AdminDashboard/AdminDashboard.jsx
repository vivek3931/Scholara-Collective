import React, { useState, useEffect } from 'react';
import * as api from '../../api.js';
import {
 LayoutDashboard,
 Users,
 FileText,
 Download,
 Flag,
 TrendingUp,
 Clock,
 Activity,
 Eye,
 Shield,
 Calendar,
 BarChart3,
 PieChart,
 Globe,
 BookOpen,
 Award,
 AlertTriangle,
 CheckCircle2,
 ArrowUpRight,
 ArrowDownRight,
 UserCheck,
 FileCheck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
// Import the useModal hook
import { useModal } from '../../context/ModalContext/ModalContext.jsx';

const AdminDashboard = () => {
 const [dashboardData, setDashboardData] = useState(null);
 const [loading, setLoading] = useState(true);
 // Remove local error state, use modal for errors
 // const [error, setError] = useState(null);
 const [selectedTimeframe, setSelectedTimeframe] = useState('30days');

 // Get showModal from the ModalContext
 const { showModal } = useModal();

 useEffect(() => {
  const fetchDashboardData = async () => {
try {
 const token = localStorage.getItem('token');
 console.log('Token exists:', !!token);

 const data = await api.getAdminDashboard();
 console.log('Dashboard data received:', data);
 setDashboardData(data);
} catch (err) {
 console.error('Error fetching dashboard:', err);
 console.error('Error response:', err.response?.data);
 console.error('Error status:', err.response?.status);

 let errorMessage = `Failed to load dashboard data: ${err.response?.data?.msg || err.message}`;
 if (err.response?.status === 403) {
  errorMessage = 'Access denied. You need admin privileges to view this page.';
 } else if (err.response?.status === 401) {
  errorMessage = 'Authentication failed. Please log in again.';
 }
 // Use showModal for error display
 showModal({
  type: 'error',
  title: 'Dashboard Load Error',
  message: errorMessage,
 });
 // Optionally, you might still want to set a local error state if you want to display the error message directly on the page without the modal,
 // but for consistency with modal usage, we'll rely on the modal.
 // setError(errorMessage); 
} finally {
 setLoading(false);
}
  };
  fetchDashboardData();
 }, [showModal]); // Add showModal to dependency array

 if (loading) {
  return (
<div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-onyx">
 <div className="flex flex-col items-center space-y-4">
  <div className="relative">
{/* Using the amber spinner from ResourcesSection */}
<div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-200 dark:border-amber-600"></div>
<div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-600 border-t-transparent absolute top-0 left-0 dark:border-amber-200"></div>
  </div>
  <div className="text-center">
<h3 className="text-lg font-semibold text-gray-700 dark:text-platinum font-poppins">Loading Dashboard</h3>
<p className="text-gray-500 dark:text-gray-400 font-poppins">Fetching your admin insights...</p>
  </div>
 </div>
</div>
  );
 }

 // If dashboardData is null after loading (and no error was shown by modal, meaning it's just empty data)
 if (!dashboardData) {
  return (
<div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-onyx">
 <LayoutDashboard size={64} className="mb-6 text-gray-400 dark:text-platinum" />
 <h2 className="text-2xl font-bold text-gray-700 dark:text-white mb-2 font-poppins">No Dashboard Data Available</h2>
 <p className="text-gray-500 dark:text-gray-400 font-poppins">Please check the backend connection or your permissions.</p>
</div>
  );
 }

 // Use optional chaining and default values for robustness
 const stats = dashboardData.stats || {
  totalUsers: 0,
  totalResources: 0,
  totalDownloads: 0,
  flaggedResources: 0,
  recentUsers: 0,
  recentResources: 0,
 };

 const topSubjects = dashboardData.topSubjects || [];
 const topInstitutions = dashboardData.topInstitutions || [];
 const activeUsers = dashboardData.activeUsers || [];

 // Mock data for charts (you can replace this with real data from your backend)
 const weeklyGrowthData = [
  { name: 'Mon', users: 12, resources: 8, downloads: 45 },
  { name: 'Tue', users: 19, resources: 12, downloads: 78 },
  { name: 'Wed', users: 15, resources: 15, downloads: 92 },
  { name: 'Thu', users: 22, resources: 18, downloads: 67 },
  { name: 'Fri', users: 28, resources: 22, downloads: 134 },
  { name: 'Sat', users: 18, resources: 14, downloads: 89 },
  { name: 'Sun', users: 14, resources: 10, downloads: 56 },
 ];

 const subjectDistribution = topSubjects.slice(0, 6).map((subject, index) => ({
  name: subject._id || 'Unknown',
  value: subject.count,
  color: [`#3B82F6`, `#10B981`, `#F59E0B`, `#EF4444`, `#8B5CF6`, `#06B6D4`][index]
 }));

 const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

 // Calculate growth percentages (mock data - replace with real calculations)
 const userGrowth = 12.5;
 const resourceGrowth = 8.3;
 const downloadGrowth = 23.7;
 const flaggedGrowth = -15.2;

 const StatCard = ({ title, value, icon: Icon, growth, color, subtitle }) => (
  <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl p-6 shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 hover:shadow-glow-sm transition-all duration-300 hover:scale-[1.02]">
<div className="flex items-center justify-between mb-4">
 <div className={`p-3 rounded-xl ${color}`}>
  <Icon className="w-6 h-6 text-white" />
 </div>
 {growth !== undefined && (
  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium font-poppins ${
growth >= 0
 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
 : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  }`}>
{growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
<span>{Math.abs(growth)}%</span>
  </div>
 )}
</div>
<div>
 <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 font-poppins">{value.toLocaleString()}</h3>
 <p className="text-gray-600 dark:text-platinum font-medium font-poppins">{title}</p>
 {subtitle && (
  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-poppins">{subtitle}</p>
 )}
</div>
  </div>
 );

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-transparent lg:p-6 p-2 transition-all duration-300 animate-fade-in hover:bg-gray-100">
<div className="max-w-7xl mx-auto space-y-8">
 {/* Header */}
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
  <div>
<h1 className="lg:text-4xl text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3 font-poppins">
 <div className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-glow-sm">
  <LayoutDashboard className="w-8 h-8 text-white" />
 </div>
 Admin Dashboard
</h1>
<p className="lg:text-lg text-xs text-gray-600 dark:text-platinum font-poppins">Welcome back! Here's what's happening with PaperPal.</p>
  </div>
  <div className="flex items-center space-x-4 mt-4 lg:mt-0">
<select
 value={selectedTimeframe}
 onChange={(e) => setSelectedTimeframe(e.target.value)}
 className="p-2 pr-8 border rounded-lg bg-white text-gray-700 border-gray-300 hover:border-gray-400 dark:bg-onyx/80 dark:text-platinum dark:border-onyx font-poppins focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-200 dark:focus:border-amber-200 shadow-glow-sm"
>
 <option value="7days">Last 7 days</option>
 <option value="30days">Last 30 days</option>
 <option value="90days">Last 90 days</option>
</select>
<div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500 dark:text-gray-400 font-poppins">
 <Calendar className="w-4 h-4" />
 <span>Last updated: {new Date().toLocaleString()}</span>
</div>
  </div>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
  <StatCard
title="Total Users"
value={stats.totalUsers}
icon={Users}
growth={userGrowth}
color="bg-gradient-to-r from-amber-500 to-amber-600"
subtitle={`${stats.recentUsers} new this month`}
  />
  <StatCard
title="Total Resources"
value={stats.totalResources}
icon={FileText}
growth={resourceGrowth}
color="bg-gradient-to-r from-green-500 to-green-600"
subtitle={`${stats.recentResources} added recently`}
  />
  <StatCard
title="Total Downloads"
value={stats.totalDownloads}
icon={Download}
growth={downloadGrowth}
color="bg-gradient-to-r from-blue-500 to-blue-600"
subtitle="Across all resources"
  />
  <StatCard
title="Flagged Content"
value={stats.flaggedResources}
icon={Flag}
growth={flaggedGrowth}
color="bg-gradient-to-r from-red-500 to-red-600"
subtitle="Needs review"
  />
 </div>

 {/* Charts Section */}
 <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
  {/* Weekly Growth Chart */}
  <div className="xl:col-span-2 bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl p-6 shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50">
<div className="flex items-center justify-between mb-6">
 <div>
  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 font-poppins">Weekly Activity</h3>
  <p className="text-gray-600 dark:text-platinum font-poppins">User registrations, uploads, and downloads</p>
 </div>
 <TrendingUp className="w-6 h-6 text-amber-500 dark:text-amber-200" />
</div>
<div className="h-80 ">
 <ResponsiveContainer width="100%" height="100%">
  <AreaChart data={weeklyGrowthData}>
<defs>
 <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" stopColor="#FB923C" stopOpacity={0.3} /> 
  <stop offset="95%" stopColor="#FB923C" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="colorResources" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
 </linearGradient>
</defs>
<CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" dark:stroke="#4B5563" />
<XAxis dataKey="name" stroke="#6B7280" tick={{ fill: 'var(--color-gray-600)' }} />
<YAxis stroke="#6B7280" tick={{ fill: 'var(--color-gray-600)' }} />
<Tooltip
 contentStyle={{
  backgroundColor: '#1F2937',
  border: 'none',
  borderRadius: '12px',
  color: '#F9FAFB',
  
 }}
/>
<Area
 type="monotone"
 dataKey="users"
 stroke="#FB923C" // Amber stroke
 strokeWidth={3}
 fillOpacity={1}
 fill="url(#colorUsers)"
 name="New Users"
/>
<Area
 type="monotone"
 dataKey="resources"
 stroke="#10B981"
 strokeWidth={3}
 fillOpacity={1}
 fill="url(#colorResources)"
 name="New Resources"
/>
  </AreaChart>
 </ResponsiveContainer>
</div>
  </div>

  {/* Subject Distribution */}
  <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl p-6 shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50">
<div className="flex items-center justify-between mb-6">
 <div>
  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 font-poppins">Popular Subjects</h3>
  <p className="text-gray-600 dark:text-platinum font-poppins">Resource distribution</p>
 </div>
 <PieChart className="w-6 h-6 text-amber-500 dark:text-amber-200" />
</div>
<div className="h-64">
 <ResponsiveContainer width="100%"  height="100%">
  <RechartsPieChart>
<Pie
 data={subjectDistribution}
 cx="50%"
 cy="50%"

 innerRadius={40}
 outerRadius={80}
 paddingAngle={5}
 dataKey="value"
>
 {subjectDistribution.map((entry, index) => (
  <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
</Pie>
<Tooltip
 contentStyle={{
  backgroundColor: '#1F2937',
  border: 'none',
  borderRadius: '12px',
  color: '#F9FAFB'
 }}
/>
  </RechartsPieChart>
 </ResponsiveContainer>
</div>
<div className="space-y-2 mt-4">
 {subjectDistribution.slice(0, 4).map((subject, index) => (
  <div key={index} className="flex items-center justify-between">
<div className="flex items-center space-x-2">
 <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: subject.color }}></div>
 <span className="text-sm text-gray-700 dark:text-platinum font-poppins">{subject.name}</span>
</div>
<span className="text-sm font-medium text-gray-900 dark:text-white font-poppins">{subject.value}</span>
  </div>
 ))}
</div>
  </div>
 </div>

 {/* Quick Actions & Recent Activity */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Quick Actions */}
  <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl p-6 shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50">
<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 font-poppins">
 <Shield className="w-5 h-5 text-amber-500 dark:text-amber-200" />
 Quick Actions
</h3>
<div className="space-y-3">
 <button className="w-full flex items-center space-x-3 p-3 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl transition-colors duration-200 shadow-glow-sm">
  <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
  <span className="text-amber-700 dark:text-amber-300 font-medium font-poppins">Manage Users</span>
 </button>
 <button className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-colors duration-200 shadow-glow-sm">
  <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
  <span className="text-green-700 dark:text-green-300 font-medium font-poppins">Review Resources</span>
 </button>
 <button className="w-full flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors duration-200 shadow-glow-sm">
  <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
  <span className="text-red-700 dark:text-red-300 font-medium font-poppins">Handle Flags ({stats.flaggedResources})</span>
 </button>
 <button className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors duration-200 shadow-glow-sm">
  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
  <span className="text-blue-700 dark:text-blue-300 font-medium font-poppins">View Analytics</span>
 </button>
</div>
  </div>

  {/* Top Institutions */}
  <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl p-6 shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50">
<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 font-poppins">
 <Globe className="w-5 h-5 text-amber-500 dark:text-amber-200" />
 Top Institutions
</h3>
<div className="space-y-4">
 {topInstitutions.slice(0, 5).map((inst, index) => (
  <div key={inst._id || inst.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-onyx rounded-xl shadow-glow-sm">
<div className="flex items-center space-x-3">
 <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center text-white font-bold text-sm font-poppins">
  {index + 1}
 </div>
 <div>
  <p className="font-medium text-gray-900 dark:text-white truncate max-w-[120px] font-poppins">
{inst._id || inst.name || 'Unknown'}
  </p>
  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Institution</p>
 </div>
</div>
<div className="text-right">
 <p className="font-bold text-amber-600 dark:text-amber-400 font-poppins">{inst.count}</p>
 <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">resources</p>
</div>
  </div>
 ))}
</div>
  </div>

  {/* Most Active Users */}
  <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl p-6 shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50">
<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 font-poppins">
 <Award className="w-5 h-5 text-amber-500 dark:text-amber-200" />
 Top Contributors
</h3>
<div className="space-y-4">
 {activeUsers.slice(0, 5).map((user, index) => (
  <div key={user._id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-onyx rounded-xl shadow-glow-sm">
<div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold font-poppins">
 {user.username?.charAt(0).toUpperCase() || 'U'}
</div>
<div className="flex-1 min-w-0">
 <p className="font-medium text-gray-900 dark:text-white truncate font-poppins">{user.username}</p>
 <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-poppins">{user.email}</p>
</div>
<div className="text-right">
 <p className="font-bold text-amber-600 dark:text-amber-400 font-poppins">{user.stats?.uploadCount || 0}</p>
 <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">uploads</p>
</div>
  </div>
 ))}
</div>
  </div>
 </div>

 {/* System Status */}
 <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl  p-6 shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50">
  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 font-poppins">
<Activity className="w-5 h-5 text-amber-500 dark:text-amber-200" />
System Status
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
<div className="flex items-center space-x-3">
 <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
 </div>
 <div>
  <p className="font-medium text-gray-900 dark:text-white font-poppins">Database</p>
  <p className="text-sm text-green-600 dark:text-green-400 font-poppins">Operational</p>
 </div>
</div>
<div className="flex items-center space-x-3">
 <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
 </div>
 <div>
  <p className="font-medium text-gray-900 dark:text-white font-poppins">File Storage</p>
  <p className="text-sm text-green-600 dark:text-green-400 font-poppins">Operational</p>
 </div>
</div>
<div className="flex items-center space-x-3">
 <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
 </div>
 <div>
  <p className="font-medium text-gray-900 dark:text-white font-poppins">API Services</p>
  <p className="text-sm text-green-600 dark:text-green-400 font-poppins">Operational</p>
 </div>
</div>
  </div>
 </div>
</div>
  </div>
 );
};

export default AdminDashboard;