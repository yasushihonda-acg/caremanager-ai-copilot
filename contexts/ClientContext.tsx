import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  saveClient,
  getClient,
  listClients,
  archiveClient as archiveClientFn,
  type ClientDocument,
} from '../services/firebase';
import type { Client, ClientInput } from '../types';

function documentToClient(doc: ClientDocument): Client {
  return {
    id: doc.id,
    name: doc.name,
    kana: doc.kana,
    birthDate: doc.birthDate,
    gender: doc.gender,
    careLevel: doc.careLevel as Client['careLevel'],
    lifeHistory: doc.lifeHistory,
    medicalAlerts: doc.medicalAlerts,
    address: doc.address,
    phone: doc.phone,
    insurerNumber: doc.insurerNumber,
    insuredNumber: doc.insuredNumber,
    certificationDate: doc.certificationDate,
    certificationExpiry: doc.certificationExpiry,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toDate().toISOString(),
    updatedAt: doc.updatedAt.toDate().toISOString(),
  };
}

interface ClientContextType {
  clients: Client[];
  loadingClients: boolean;
  selectedClient: Client | null;
  selectClient: (id: string) => void;
  clearSelectedClient: () => void;
  createClient: (data: ClientInput) => Promise<string>;
  updateClient: (id: string, data: ClientInput) => Promise<void>;
  archiveClient: (id: string) => Promise<void>;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const refreshClients = useCallback(async () => {
    if (!user) {
      setClients([]);
      setLoadingClients(false);
      return;
    }
    setLoadingClients(true);
    try {
      const docs = await listClients(user.uid);
      setClients(docs.map(documentToClient));
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoadingClients(false);
    }
  }, [user]);

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  useEffect(() => {
    if (!user) {
      setSelectedClient(null);
      setClients([]);
    }
  }, [user]);

  const selectClient = useCallback(
    (id: string) => {
      const client = clients.find((c) => c.id === id);
      if (client) {
        setSelectedClient(client);
      }
    },
    [clients]
  );

  const clearSelectedClient = useCallback(() => {
    setSelectedClient(null);
  }, []);

  const createClient = useCallback(
    async (data: ClientInput): Promise<string> => {
      if (!user) throw new Error('Not authenticated');
      const clientId = crypto.randomUUID();
      await saveClient(user.uid, clientId, data);
      const doc = await getClient(user.uid, clientId);
      if (doc) {
        const newClient = documentToClient(doc);
        setClients((prev) => [...prev, newClient].sort((a, b) => a.kana.localeCompare(b.kana)));
      }
      return clientId;
    },
    [user]
  );

  const updateClient = useCallback(
    async (id: string, data: ClientInput): Promise<void> => {
      if (!user) throw new Error('Not authenticated');
      await saveClient(user.uid, id, data);
      const doc = await getClient(user.uid, id);
      if (doc) {
        const updated = documentToClient(doc);
        setClients((prev) =>
          prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.kana.localeCompare(b.kana))
        );
        if (selectedClient?.id === id) {
          setSelectedClient(updated);
        }
      }
    },
    [user, selectedClient]
  );

  const archiveClient = useCallback(
    async (id: string): Promise<void> => {
      if (!user) throw new Error('Not authenticated');
      await archiveClientFn(user.uid, id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      if (selectedClient?.id === id) {
        setSelectedClient(null);
      }
    },
    [user, selectedClient]
  );

  return (
    <ClientContext.Provider
      value={{
        clients,
        loadingClients,
        selectedClient,
        selectClient,
        clearSelectedClient,
        createClient,
        updateClient,
        archiveClient,
        refreshClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}
