"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Bell,
  Building,
  CheckCircle,
  Clock,
  CreditCard,
  Edit,
  Eye,
  Megaphone,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  // Statistics Data
  const [stats] = useState({
    totalStudents: 1245,
    totalRooms: 320,
    occupiedRooms: 285,
    pendingPayments: 87,
    pendingMaintenance: 23,
    pendingComplaints: 12,
    totalRevenue: 6225000,
    overduePayments: 425000,
  });

  // Recent Students
  const [recentStudents] = useState([
    {
      id: 1,
      name: "Mohammad Ahmed",
      studentId: "20210001",
      hall: "Rajshahi Hall",
      room: "A-205",
      status: "active",
      joinDate: "2025-09-01",
    },
    {
      id: 2,
      name: "Fahim Hassan",
      studentId: "20210045",
      hall: "Shahid Habib Hall",
      room: "B-112",
      status: "active",
      joinDate: "2025-09-03",
    },
    {
      id: 3,
      name: "Rahim Uddin",
      studentId: "20210078",
      hall: "Rajshahi Hall",
      room: "C-310",
      status: "pending",
      joinDate: "2026-01-15",
    },
    {
      id: 4,
      name: "Karim Hossain",
      studentId: "20210092",
      hall: "Shahid Habib Hall",
      room: "D-405",
      status: "active",
      joinDate: "2025-09-05",
    },
    {
      id: 5,
      name: "Tanvir Islam",
      studentId: "20210110",
      hall: "Rajshahi Hall",
      room: "A-108",
      status: "inactive",
      joinDate: "2024-09-01",
    },
  ]);

  // Room Data
  const [rooms] = useState([
    {
      id: 1,
      number: "A-101",
      hall: "Rajshahi Hall",
      capacity: 2,
      occupied: 2,
      status: "full",
    },
    {
      id: 2,
      number: "A-102",
      hall: "Rajshahi Hall",
      capacity: 2,
      occupied: 1,
      status: "partial",
    },
    {
      id: 3,
      number: "A-103",
      hall: "Rajshahi Hall",
      capacity: 2,
      occupied: 0,
      status: "empty",
    },
    {
      id: 4,
      number: "B-201",
      hall: "Shahid Habib Hall",
      capacity: 3,
      occupied: 3,
      status: "full",
    },
    {
      id: 5,
      number: "B-202",
      hall: "Shahid Habib Hall",
      capacity: 3,
      occupied: 2,
      status: "partial",
    },
  ]);

  // Payment Data
  const [payments] = useState([
    {
      id: 1,
      studentName: "Mohammad Ahmed",
      studentId: "20210001",
      amount: 5000,
      month: "January 2026",
      dueDate: "2026-01-31",
      status: "overdue",
    },
    {
      id: 2,
      studentName: "Fahim Hassan",
      studentId: "20210045",
      amount: 5000,
      month: "January 2026",
      dueDate: "2026-01-31",
      status: "paid",
      paidDate: "2026-01-25",
    },
    {
      id: 3,
      studentName: "Rahim Uddin",
      studentId: "20210078",
      amount: 5000,
      month: "January 2026",
      dueDate: "2026-01-31",
      status: "pending",
    },
    {
      id: 4,
      studentName: "Karim Hossain",
      studentId: "20210092",
      amount: 5000,
      month: "January 2026",
      dueDate: "2026-01-31",
      status: "paid",
      paidDate: "2026-01-20",
    },
  ]);

  // Notices Data
  const [notices] = useState([
    {
      id: 1,
      title: "Maintenance Work - Floor 2",
      description: "Water pipeline maintenance on Floor 2 (9 AM - 5 PM)",
      date: "2026-01-29",
      priority: "high",
      status: "active",
    },
    {
      id: 2,
      title: "Hall Inspection Schedule",
      description: "Monthly inspection on all floors",
      date: "2026-01-28",
      priority: "medium",
      status: "active",
    },
    {
      id: 3,
      title: "Guest Policy Update",
      description: "New guest pass guidelines",
      date: "2026-01-25",
      priority: "low",
      status: "expired",
    },
  ]);

  // Maintenance Requests
  const [maintenanceRequests] = useState([
    {
      id: 1,
      title: "Leaking Tap",
      room: "A-205",
      studentName: "Mohammad Ahmed",
      status: "in-progress",
      priority: "high",
      submittedDate: "2026-01-25",
    },
    {
      id: 2,
      title: "Broken Light",
      room: "B-112",
      studentName: "Fahim Hassan",
      status: "pending",
      priority: "medium",
      submittedDate: "2026-01-27",
    },
    {
      id: 3,
      title: "Window Repair",
      room: "C-310",
      studentName: "Rahim Uddin",
      status: "completed",
      priority: "low",
      submittedDate: "2026-01-20",
    },
  ]);

  // Complaints
  const [complaints] = useState([
    {
      id: 1,
      title: "Noise Complaint",
      room: "A-206",
      studentName: "Mohammad Ahmed",
      status: "resolved",
      date: "2026-01-20",
    },
    {
      id: 2,
      title: "Cleaning Issues",
      room: "B-115",
      studentName: "Fahim Hassan",
      status: "in-progress",
      date: "2026-01-26",
    },
    {
      id: 3,
      title: "Food Quality",
      room: "C-312",
      studentName: "Rahim Uddin",
      status: "pending",
      date: "2026-01-28",
    },
  ]);

  const getStatusVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "paid":
      case "active":
      case "resolved":
      case "completed":
      case "full":
        return "default";
      case "pending":
      case "partial":
      case "in-progress":
        return "secondary";
      case "overdue":
      case "inactive":
      case "expired":
        return "destructive";
      case "empty":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPriorityVariant = (
    priority: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <>
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s an overview of your hall management system.
        </p>
      </div>

      {/* Alert for Pending Actions */}
      {(stats.pendingPayments > 0 || stats.pendingMaintenance > 0) && (
        <Alert className="mb-6 border-chart-4 bg-chart-4/10">
          <Bell className="h-4 w-4 text-chart-4" />
          <AlertDescription className="text-chart-4">
            You have{" "}
            <span className="font-bold">
              {stats.pendingPayments} pending payments
            </span>{" "}
            and{" "}
            <span className="font-bold">
              {stats.pendingMaintenance} maintenance requests
            </span>{" "}
            requiring attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Total Students
                </p>
                <p className="text-2xl md:text-3xl font-bold text-foreground mt-1 md:mt-2">
                  {stats.totalStudents.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Occupied Rooms
                </p>
                <p className="text-2xl md:text-3xl font-bold text-foreground mt-1 md:mt-2">
                  {stats.occupiedRooms}/{stats.totalRooms}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-chart-2/10 rounded-xl flex items-center justify-center">
                <Building className="w-5 h-5 md:w-6 md:h-6 text-chart-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Total Revenue
                </p>
                <p className="text-xl md:text-2xl font-bold text-primary mt-1 md:mt-2">
                  ৳{(stats.totalRevenue / 1000).toLocaleString()}K
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Overdue
                </p>
                <p className="text-xl md:text-2xl font-bold text-destructive mt-1 md:mt-2">
                  ৳{(stats.overduePayments / 1000).toLocaleString()}K
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4 md:gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-chart-4/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-chart-4" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-chart-4">
                {stats.pendingPayments}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Pending Payments
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-chart-3/10 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 md:w-6 md:h-6 text-chart-3" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-chart-3">
                {stats.pendingMaintenance}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Maintenance
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-destructive">
                {stats.pendingComplaints}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">
                Complaints
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="students" className="mt-8">
        <Card className="mb-6">
          <CardContent className="p-2">
            <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-1 bg-transparent">
              <TabsTrigger value="students" className="gap-2">
                <Users className="w-4 h-4" />
                Students
              </TabsTrigger>
              <TabsTrigger value="rooms" className="gap-2">
                <Building className="w-4 h-4" />
                Rooms
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="notices" className="gap-2">
                <Megaphone className="w-4 h-4" />
                Notices
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="gap-2">
                <Wrench className="w-4 h-4" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="complaints" className="gap-2">
                <AlertTriangle className="w-4 h-4" />
                Complaints
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Student Management</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    className="pl-9 w-64"
                  />
                </div>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Hall</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.hall}</TableCell>
                      <TableCell>{student.room}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(student.status)}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(student.joinDate).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Room Management</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search rooms..." className="pl-9 w-64" />
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room No.</TableHead>
                    <TableHead>Hall</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Occupied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">
                        {room.number}
                      </TableCell>
                      <TableCell>{room.hall}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell>
                        {room.occupied}/{room.capacity}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(room.status)}>
                          {room.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Payment Management</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    className="pl-9 w-64"
                  />
                </div>
                <Button variant="outline">Export Report</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.studentName}
                      </TableCell>
                      <TableCell>{payment.studentId}</TableCell>
                      <TableCell>{payment.month}</TableCell>
                      <TableCell className="font-semibold">
                        ৳{payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(payment.dueDate).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payment.status !== "paid" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notices Tab */}
        <TabsContent value="notices" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Notice Management</CardTitle>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Notice
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map((notice) => (
                    <TableRow key={notice.id}>
                      <TableCell className="font-medium">
                        {notice.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {notice.description}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(notice.date).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityVariant(notice.priority)}>
                          {notice.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(notice.status)}>
                          {notice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Maintenance Requests</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.title}
                      </TableCell>
                      <TableCell>{request.room}</TableCell>
                      <TableCell>{request.studentName}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityVariant(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(request.submittedDate).toLocaleDateString(
                          "en-GB",
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complaints Tab */}
        <TabsContent value="complaints" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Complaint Management</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search complaints..."
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">
                        {complaint.title}
                      </TableCell>
                      <TableCell>{complaint.room}</TableCell>
                      <TableCell>{complaint.studentName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(complaint.date).toLocaleDateString("en-GB")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(complaint.status)}>
                          {complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {complaint.status !== "resolved" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
