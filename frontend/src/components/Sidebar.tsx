import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.tsx';
import { 
  Menu,
  X,
  LayoutDashboard,
  Users,
  Building,
  Monitor,
  Ticket,
  BarChart,
  Shield,
  Settings,
  LogOut,
  ListTodo,
  FileText,
  CalendarDays,
  ClipboardList,
  Stethoscope,
  Receipt,
  Wallet
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionModule } from '@/types';
import SettingsDropdown from './SettingsDropdown';
import styles from './Sidebar.module.css';
import { clinicalModuleDefinitions } from '@/config/clinicalModules';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  module: PermissionModule; // Nuevo campo para asociar con permisos
}

const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'tecnico', 'technician'],
    module: 'dashboard'
  },
  {
    path: '/usuarios',
    label: 'Usuarios',
    icon: Users,
    roles: ['admin'],
    module: 'users'
  },
  {
    path: '/pacientes',
    label: 'Pacientes',
    icon: Users,
    roles: ['admin'],
    module: 'users'
  },
  {
    path: '/departamentos',
    label: 'Servicios',
    icon: Building,
    roles: ['admin'],
    module: 'users'
  },
  {
    path: '/equipos',
    label: 'Equipos',
    icon: Monitor,
    roles: ['admin', 'tecnico', 'technician', 'inventario'],
    module: 'equipment'
  },
  {
    path: '/tickets',
    label: 'Consultas',
    icon: Ticket,
    roles: ['admin', 'tecnico', 'technician', 'usuario', 'user', 'inventario'],
    module: 'tickets'
  },
  {
    path: '/actividades',
    label: 'Bitácora',
    icon: ListTodo,
    roles: ['admin', 'tecnico'],
    module: 'tickets' 
  },
  {
    path: '/insumos',
    label: 'Insumos',
    icon: Monitor,
    roles: ['admin', 'inventario'],
    module: 'supplies'
  },
  {
    path: '/reportes',
    label: 'Reportes',
    icon: BarChart,
    roles: ['admin'],
    module: 'reports'
  },
  {
    path: '/permisos',
    label: 'Permisos',
    icon: Shield,
    roles: ['admin'],
    module: 'permissions'
  }
];

  const clinicalModuleIcons: Record<string, React.ElementType> = {
    'doctores': Stethoscope,
    'historial-clinico': ClipboardList,
    'consentimiento-informado': FileText,
    'justificantes': Receipt,
    'tratamientos': FileText,
    'historial-odontograma': ClipboardList,
    'agenda-citas': CalendarDays,
    'centros-medicos': Building,
    'reportes-financieros': Wallet,
    'pacientes-adeudos': Wallet,
    'recetas-medicas': FileText
  };

  const clinicalMenuItems: MenuItem[] = clinicalModuleDefinitions.map(definition => ({
    path: definition.path,
    label: definition.label,
    icon: clinicalModuleIcons[definition.key] || FileText,
    roles: ['admin'],
    module: definition.permissionModule
  }));

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, logout } = useAuth();
  const { hasModuleAccess } = usePermissions();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openSettingsControl = () => {
    setShowSettings(true);
  };

  // Filtrar elementos del menú por permisos del usuario
  const allMenuItems = [
    ...menuItems.slice(0, 3),
    ...clinicalMenuItems,
    ...menuItems.slice(3)
  ];

  const filteredMenuItems = allMenuItems.filter(item => {
    if (!user) return false;
    
    // Verificar si tiene acceso al módulo mediante permisos
    const hasPermission = hasModuleAccess(item.module);
    
    // Fallback a roles para compatibilidad (admin siempre tiene acceso)
    const hasRole = item.roles.includes(user.role);
    
    return hasPermission || hasRole;
  });

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
  <>
      {/* Mobile menu button */}
      <button
        className={styles.mobileMenuButton}
        onClick={toggleMobile}
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={closeMobile} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>

        <div className={styles.sidebarHeader}>
          <button
            className={styles.closeButton}
            onClick={closeMobile}
            aria-label="Cerrar menú"
          >
            <X size={24} />
          </button>
          <div className={styles.logo}>
            {!isCollapsed && (
              <div className={styles.logoText}>
                <h2>Consultorio Dental</h2>
                <p>Gestión</p>
              </div>
            )}
          </div>
          <button
            className={styles.collapseButton}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.menuList}>
            {filteredMenuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `${styles.menuItem} ${isActive ? styles.active : ''}`
                  }
                  onClick={closeMobile}
                >
                  <item.icon size={20} />
                  {!isCollapsed && <span className={styles.menuLabel}>{item.label}</span>}
                </NavLink>
              </li>
            ))}
            
            {/* Centro de Control del Sistema - Solo Admin */}
            {user?.role === 'admin' && (
              <li>
                <button
                  className={styles.menuItem}
                  onClick={openSettingsControl}
                  title="Centro de Control del Sistema"
                  style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <Settings size={20} />
                  {!isCollapsed && (
                    <span className={styles.menuLabel}>Centro de Control</span>
                  )}
                </button>
              </li>
            )}

            {/* Botón Salir */}
            <li>
              <button
                className={styles.menuItem}
                onClick={handleLogout}
                title="Cerrar sesión"
                style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <LogOut size={20} />
                {!isCollapsed && (
                  <span className={styles.menuLabel}>Salir</span>
                )}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Modal de Centro de Control */}
      {showSettings && (
        <SettingsDropdown onClose={() => setShowSettings(false)} />
      )}
    </>
  );
};

export default Sidebar;