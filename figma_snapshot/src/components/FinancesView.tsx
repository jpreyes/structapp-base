import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  CreditCard,
  Receipt,
  Plus,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface Transaction {
  id: string;
  type: 'Ingreso' | 'Egreso' | 'Factura' | 'Reembolso' | 'Nota de Crédito';
  project: string;
  amount: number;
  description: string;
  date: string;
  status: 'Pagado' | 'Pendiente' | 'Vencido';
  client?: string;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'Factura',
    project: 'Edificio Residencial Torre Norte',
    amount: 125000,
    description: 'Pago adelanto 50% - Diseño estructural',
    date: '2024-03-15',
    status: 'Pagado',
    client: 'Constructora ABC',
  },
  {
    id: '2',
    type: 'Egreso',
    project: 'Centro Comercial Plaza Sur',
    amount: 8500,
    description: 'Compra de sensores de monitoreo',
    date: '2024-03-14',
    status: 'Pagado',
  },
  {
    id: '3',
    type: 'Ingreso',
    project: 'Puente Vehicular Av. Principal',
    amount: 45000,
    description: 'Pago final inspección estructural',
    date: '2024-03-12',
    status: 'Pagado',
    client: 'Gobierno Municipal',
  },
  {
    id: '4',
    type: 'Factura',
    project: 'Estadio Deportivo Municipal',
    amount: 89000,
    description: 'Análisis sísmico - Primera fase',
    date: '2024-03-10',
    status: 'Pendiente',
    client: 'Gobierno Estatal',
  },
  {
    id: '5',
    type: 'Reembolso',
    project: 'Centro Comercial Plaza Sur',
    amount: 3200,
    description: 'Viáticos visita de inspección',
    date: '2024-03-08',
    status: 'Pagado',
  },
  {
    id: '6',
    type: 'Nota de Crédito',
    project: 'Edificio Residencial Torre Norte',
    amount: 5000,
    description: 'Ajuste por modificación en alcance',
    date: '2024-03-05',
    status: 'Pagado',
    client: 'Constructora ABC',
  },
];

const expensesByCategory = [
  { name: 'Personal', value: 45000, color: '#3b82f6' },
  { name: 'Equipos', value: 18000, color: '#8b5cf6' },
  { name: 'Software', value: 12000, color: '#ec4899' },
  { name: 'Viáticos', value: 8500, color: '#f59e0b' },
  { name: 'Servicios', value: 6500, color: '#10b981' },
];

const monthlyRevenue = [
  { month: 'Ene', ingresos: 125000, egresos: 45000 },
  { month: 'Feb', ingresos: 98000, egresos: 52000 },
  { month: 'Mar', ingresos: 156000, egresos: 48000 },
  { month: 'Abr', ingresos: 142000, egresos: 51000 },
  { month: 'May', ingresos: 178000, egresos: 55000 },
  { month: 'Jun', ingresos: 165000, egresos: 49000 },
];

export function FinancesView() {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'Ingreso':
        return 'bg-green-100 text-green-700';
      case 'Egreso':
        return 'bg-red-100 text-red-700';
      case 'Factura':
        return 'bg-blue-100 text-blue-700';
      case 'Reembolso':
        return 'bg-purple-100 text-purple-700';
      case 'Nota de Crédito':
        return 'bg-orange-100 text-orange-700';
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'Pagado':
        return 'bg-green-100 text-green-700';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-700';
      case 'Vencido':
        return 'bg-red-100 text-red-700';
    }
  };

  const totalIngresos = transactions
    .filter(t => t.type === 'Ingreso' || t.type === 'Factura')
    .reduce((sum, t) => sum + (t.status === 'Pagado' ? t.amount : 0), 0);

  const totalEgresos = transactions
    .filter(t => t.type === 'Egreso')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendientesCobro = transactions
    .filter(t => (t.type === 'Ingreso' || t.type === 'Factura') && t.status === 'Pendiente')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-2">Finanzas</h1>
          <p className="text-gray-600">Gestión financiera de proyectos y organización</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Transacción
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Transacción</DialogTitle>
                <DialogDescription>
                  Ingresa los detalles de la transacción financiera
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingreso">Ingreso</SelectItem>
                        <SelectItem value="egreso">Egreso</SelectItem>
                        <SelectItem value="factura">Factura</SelectItem>
                        <SelectItem value="reembolso">Reembolso</SelectItem>
                        <SelectItem value="nota-credito">Nota de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Monto (MXN)</Label>
                    <Input id="amount" type="number" placeholder="0.00" step="0.01" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project">Proyecto</Label>
                  <Select>
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="p1">Edificio Residencial Torre Norte</SelectItem>
                      <SelectItem value="p2">Centro Comercial Plaza Sur</SelectItem>
                      <SelectItem value="p3">Puente Vehicular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" placeholder="Detalles de la transacción..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pagado">Pagado</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsDialogOpen(false)}>
                  Guardar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Ingresos</p>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl text-gray-900 mb-1">
              ${totalIngresos.toLocaleString('es-MX')}
            </p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12.5% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Egresos</p>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-2xl text-gray-900 mb-1">
              ${totalEgresos.toLocaleString('es-MX')}
            </p>
            <p className="text-xs text-red-600 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              -3.2% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Pendiente de Cobro</p>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Receipt className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-2xl text-gray-900 mb-1">
              ${pendientesCobro.toLocaleString('es-MX')}
            </p>
            <p className="text-xs text-gray-600">1 factura pendiente</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Utilidad Neta</p>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl text-gray-900 mb-1">
              ${(totalIngresos - totalEgresos).toLocaleString('es-MX')}
            </p>
            <p className="text-xs text-blue-600">
              Margen: {(((totalIngresos - totalEgresos) / totalIngresos) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString('es-MX')}`} />
                <Legend />
                <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
                <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toLocaleString('es-MX')}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
          <TabsTrigger value="egresos">Egresos</TabsTrigger>
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
          <TabsTrigger value="reembolsos">Reembolsos</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'Ingreso' || transaction.type === 'Factura'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}>
                        {transaction.type === 'Factura' ? (
                          <FileText className={`w-5 h-5 ${
                            transaction.type === 'Ingreso' || transaction.type === 'Factura'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`} />
                        ) : transaction.type === 'Reembolso' ? (
                          <CreditCard className="w-5 h-5 text-purple-600" />
                        ) : (
                          <DollarSign className={`w-5 h-5 ${
                            transaction.type === 'Ingreso'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm text-gray-900">{transaction.description}</p>
                          <Badge className={getTypeColor(transaction.type)}>
                            {transaction.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">{transaction.project}</p>
                        {transaction.client && (
                          <p className="text-xs text-gray-500">{transaction.client}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${
                          transaction.type === 'Ingreso' || transaction.type === 'Factura'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'Ingreso' || transaction.type === 'Factura' ? '+' : '-'}
                          ${transaction.amount.toLocaleString('es-MX')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingresos">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions
                  .filter(t => t.type === 'Ingreso')
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.project}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-600">
                            +${transaction.amount.toLocaleString('es-MX')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="egresos">
          <Card>
            <CardHeader>
              <CardTitle>Egresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions
                  .filter(t => t.type === 'Egreso')
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.project}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-red-600">
                            -${transaction.amount.toLocaleString('es-MX')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facturas">
          <Card>
            <CardHeader>
              <CardTitle>Facturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions
                  .filter(t => t.type === 'Factura')
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.project}</p>
                          {transaction.client && (
                            <p className="text-xs text-gray-500">{transaction.client}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-600">
                            ${transaction.amount.toLocaleString('es-MX')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reembolsos">
          <Card>
            <CardHeader>
              <CardTitle>Reembolsos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions
                  .filter(t => t.type === 'Reembolso')
                  .map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.project}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-purple-600">
                            ${transaction.amount.toLocaleString('es-MX')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
