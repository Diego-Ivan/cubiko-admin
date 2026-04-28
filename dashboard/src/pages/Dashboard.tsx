import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Clock, History, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'extensions'>('active');
  const [reservations, setReservations] = useState<any[]>([]);
  const [extensions, setExtensions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRes, extRes] = await Promise.all([
        api.get('/reservas/all'),
        api.get('/reservas/extensions/all')
      ]);
      setReservations(resRes.data.data);
      setExtensions(extRes.data.data);
    } catch (error) {
      console.error('Error al obtener datos', error);
      if ((error as any).response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResolveExtension = async (id: number, status: 'Aprobada' | 'Rechazada') => {
    try {
      await api.patch(`/reservas/extensions/${id}/resolve`, { status });
      fetchData(); // refrescar datos
    } catch (error) {
      alert('Error al resolver la extensión');
    }
  };

  const isSurpassedTime = (res: any) => {
    const now = new Date();
    const endDateTime = new Date(`${res.fechaInicio.split('T')[0]}T${res.horaFin}`);
    return now > endDateTime;
  };

  const isNotActivatedButPassed = (res: any) => {
    const now = new Date();
    const startDateTime = new Date(`${res.fechaInicio.split('T')[0]}T${res.horaInicio}`);
    return now > startDateTime && res.status === 'Activa'; 
  };

  const activeReservations = reservations.filter(r => r.status === 'Activa' || new Date(`${r.fechaInicio.split('T')[0]}T${r.horaFin}`) >= new Date());
  const historyReservations = reservations.filter(r => r.status !== 'Activa' && new Date(`${r.fechaInicio.split('T')[0]}T${r.horaFin}`) < new Date());

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Panel de Administración de Cubiko</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`${activeTab === 'active' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Calendar className="mr-2 h-5 w-5" /> Activas/Futuras
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <History className="mr-2 h-5 w-5" /> Historial
            </button>
            <button
              onClick={() => setActiveTab('extensions')}
              className={`${activeTab === 'extensions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <Clock className="mr-2 h-5 w-5" /> Extensiones
              {extensions.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {extensions.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              
              {activeTab === 'active' && activeReservations.map((res) => (
                <li key={res.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{res.sala_ubicacion} - Sala {res.sala_numero}</span>
                        <span className="text-sm text-gray-500">{res.estudiante_nombre} ({res.estudiante_email})</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-900">{new Date(res.fechaInicio).toLocaleDateString()}</span>
                      <span className="text-sm text-gray-500">{res.horaInicio} - {res.horaFin}</span>
                      
                      {isSurpassedTime(res) && (
                        <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" /> Tiempo excedido
                        </span>
                      )}
                      {!isSurpassedTime(res) && isNotActivatedButPassed(res) && (
                        <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertCircle className="w-3 h-3 mr-1" /> No activada
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}

              {activeTab === 'history' && historyReservations.map((res) => (
                <li key={res.id} className="p-4 hover:bg-gray-50 opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{res.sala_ubicacion} - Sala {res.sala_numero}</span>
                      <span className="text-sm text-gray-500">{res.estudiante_nombre}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-900">{new Date(res.fechaInicio).toLocaleDateString()}</span>
                      <span className={`text-sm ${res.status === 'Cancelada' ? 'text-red-500' : 'text-gray-500'}`}>{res.status}</span>
                    </div>
                  </div>
                </li>
              ))}

              {activeTab === 'extensions' && extensions.length === 0 && (
                <div className="p-8 text-center text-gray-500">No hay solicitudes de extensión pendientes.</div>
              )}

              {activeTab === 'extensions' && extensions.map((ext) => (
                <li key={ext.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {ext.sala_ubicacion} - Sala {ext.sala_numero} (+{ext.extensionHoras} hora{ext.extensionHoras > 1 ? 's' : ''})
                      </span>
                      <span className="text-sm text-gray-500">Solicitado por: {ext.estudiante_nombre}</span>
                      <span className="text-xs text-gray-400 mt-1">Hora de fin actual: {ext.horaFin}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResolveExtension(ext.id, 'Aprobada')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Aprobar
                      </button>
                      <button
                        onClick={() => handleResolveExtension(ext.id, 'Rechazada')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Rechazar
                      </button>
                    </div>
                  </div>
                </li>
              ))}

            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
