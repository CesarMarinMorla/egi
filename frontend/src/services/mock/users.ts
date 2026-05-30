import type { User } from '../../types'

/** Usuarios de prueba — cualquier contraseña es válida en mock. */
export const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'sysadmin',
    displayName: 'Admin Sistema',
    role: 'sysadmin',
    labs: [],
  },
  {
    id: '2',
    username: 'manager',
    displayName: 'María Gestora',
    role: 'manager',
    labs: [],
  },
  {
    id: '3',
    username: 'editor',
    displayName: 'Carlos Técnico',
    role: 'editor',
    labs: ['Lab 101', 'Lab 102'],
  },
  {
    id: '4',
    username: 'operator',
    displayName: 'Ana Operadora',
    role: 'operator',
    labs: ['Lab 101'],
  },
  {
    id: '5',
    username: 'readonly',
    displayName: 'Prof. Solo Lectura',
    role: 'readonly',
    labs: ['Lab 101'],
  },
]
