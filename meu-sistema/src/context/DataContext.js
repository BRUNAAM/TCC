"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { auth, db } from "../config/firebase"
import { collection, getDocs, onSnapshot, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

// Função para gerar chave de cache específica do usuário
const getCacheKey = (userId, dataType) => {
    return `coffeeGraderData_${userId}_${dataType}`
}

const DataContext = createContext()

export const useData = () => {
    const context = useContext(DataContext)
    if (!context) {
        throw new Error("useData deve ser usado dentro de DataProvider")
    }
    return context
}

export const DataProvider = ({ children }) => {
    const [fornecedores, setFornecedores] = useState([])
    const [avaliacoesCOB, setAvaliacoesCOB] = useState([])
    const [avaliacoesSCAA, setAvaliacoesSCAA] = useState([])
    const [loading, setLoading] = useState(true)
    const [lastSync, setLastSync] = useState(null)
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [syncStatus, setSyncStatus] = useState("idle")
    const [currentUser, setCurrentUser] = useState(null)

    // Limpar dados ao deslogar
    const clearData = useCallback(() => {
        setFornecedores([])
        setAvaliacoesCOB([])
        setAvaliacoesSCAA([])
        setLastSync(null)
        setLoading(false)
        setSyncStatus("idle")
    }, [])

    // Função para atualizar dados manualmente - MOVIDA PARA CIMA
    const refreshData = useCallback(async () => {
        if (!currentUser || !isOnline) {
            console.log("⚠️ Não é possível atualizar: usuário não autenticado ou offline")
            return
        }

        setSyncStatus("syncing")
        setLoading(true)

        // Função local para salvar no cache
        const saveToCache = (userId, dataType, data) => {
            try {
                localStorage.setItem(getCacheKey(userId, dataType), JSON.stringify(data))
                localStorage.setItem(getCacheKey(userId, "lastSync"), new Date().toISOString())
                setLastSync(new Date().toISOString())
            } catch (error) {
                console.error(`❌ Erro ao salvar ${dataType} no cache:`, error)
            }
        }

        try {
            console.log("🔄 Atualizando dados do Firestore...")

            // Buscar fornecedores
            const fornecedoresSnapshot = await getDocs(
                query(collection(db, "usuarios", currentUser.uid, "fornecedores"), orderBy("nome")),
            )
            const fornecedoresData = fornecedoresSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))

            // Buscar avaliações COB
            const cobSnapshot = await getDocs(
                query(collection(db, "usuarios", currentUser.uid, "avaliacoes_cob"), orderBy("data", "desc")),
            )
            const cobData = cobSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))

            // Buscar avaliações SCAA
            const scaaSnapshot = await getDocs(
                query(collection(db, "usuarios", currentUser.uid, "avaliacoes_scaa"), orderBy("data", "desc")),
            )
            const scaaData = scaaSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))

            // Atualizar estados
            setFornecedores(fornecedoresData)
            setAvaliacoesCOB(cobData)
            setAvaliacoesSCAA(scaaData)

            // Salvar no cache
            saveToCache(currentUser.uid, "fornecedores", fornecedoresData)
            saveToCache(currentUser.uid, "avaliacoesCOB", cobData)
            saveToCache(currentUser.uid, "avaliacoesSCAA", scaaData)

            setSyncStatus("success")
            console.log("✅ Dados atualizados com sucesso!")
            console.log(`📊 Total: ${fornecedoresData.length} fornecedores, ${cobData.length} COB, ${scaaData.length} SCAA`)
        } catch (error) {
            console.error("❌ Erro ao atualizar dados:", error)
            setSyncStatus("error")
        } finally {
            setLoading(false)
        }
    }, [currentUser, isOnline])

    // Monitorar status de conexão - AGORA refreshData JÁ ESTÁ DEFINIDO
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            console.log("🌐 Conexão restaurada - sincronizando dados...")
            if (currentUser) {
                refreshData()
            }
        }

        const handleOffline = () => {
            setIsOnline(false)
            console.log("📴 Modo offline ativado")
        }

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [currentUser, refreshData])

    // Monitorar autenticação
    useEffect(() => {
        // Carregar dados do cache local
        const loadDataFromCache = (userId) => {
            try {
                console.log("💾 Carregando dados do cache local...")

                const cachedFornecedores = localStorage.getItem(getCacheKey(userId, "fornecedores"))
                const cachedCOB = localStorage.getItem(getCacheKey(userId, "avaliacoesCOB"))
                const cachedSCAA = localStorage.getItem(getCacheKey(userId, "avaliacoesSCAA"))
                const cachedLastSync = localStorage.getItem(getCacheKey(userId, "lastSync"))

                if (cachedFornecedores) {
                    const fornecedoresData = JSON.parse(cachedFornecedores)
                    setFornecedores(fornecedoresData)
                    console.log(`📋 ${fornecedoresData.length} fornecedores carregados do cache`)
                }

                if (cachedCOB) {
                    const cobData = JSON.parse(cachedCOB)
                    setAvaliacoesCOB(cobData)
                    console.log(`☕ ${cobData.length} avaliações COB carregadas do cache`)
                }

                if (cachedSCAA) {
                    const scaaData = JSON.parse(cachedSCAA)
                    setAvaliacoesSCAA(scaaData)
                    console.log(`🏆 ${scaaData.length} avaliações SCAA carregadas do cache`)
                }

                if (cachedLastSync) {
                    setLastSync(cachedLastSync)
                }

                setLoading(false)
            } catch (error) {
                console.error("❌ Erro ao carregar cache:", error)
                setLoading(false)
            }
        }

        // Salvar dados no cache local
        const saveToCache = (userId, dataType, data) => {
            try {
                localStorage.setItem(getCacheKey(userId, dataType), JSON.stringify(data))
                localStorage.setItem(getCacheKey(userId, "lastSync"), new Date().toISOString())
                setLastSync(new Date().toISOString())
            } catch (error) {
                console.error(`❌ Erro ao salvar ${dataType} no cache:`, error)
            }
        }

        // Configurar listeners em tempo real
        const setupRealtimeListeners = (userId) => {
            console.log("🔄 Configurando listeners em tempo real...")

            // Listener para fornecedores
            const fornecedoresQuery = query(collection(db, "usuarios", userId, "fornecedores"), orderBy("nome"))

            const unsubscribeFornecedores = onSnapshot(
                fornecedoresQuery,
                (snapshot) => {
                    const fornecedoresData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))

                    setFornecedores(fornecedoresData)
                    saveToCache(userId, "fornecedores", fornecedoresData)
                    console.log(`📋 ${fornecedoresData.length} fornecedores sincronizados`)
                },
                (error) => {
                    console.error("❌ Erro no listener de fornecedores:", error)
                    setSyncStatus("error")
                },
            )

            // Listener para avaliações COB
            const cobQuery = query(collection(db, "usuarios", userId, "avaliacoes_cob"), orderBy("data", "desc"))

            const unsubscribeCOB = onSnapshot(
                cobQuery,
                (snapshot) => {
                    const cobData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))

                    setAvaliacoesCOB(cobData)
                    saveToCache(userId, "avaliacoesCOB", cobData)
                    console.log(`☕ ${cobData.length} avaliações COB sincronizadas`)
                },
                (error) => {
                    console.error("❌ Erro no listener de COB:", error)
                    setSyncStatus("error")
                },
            )

            // Listener para avaliações SCAA
            const scaaQuery = query(collection(db, "usuarios", userId, "avaliacoes_scaa"), orderBy("data", "desc"))

            const unsubscribeSCAA = onSnapshot(
                scaaQuery,
                (snapshot) => {
                    const scaaData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))

                    setAvaliacoesSCAA(scaaData)
                    saveToCache(userId, "avaliacoesSCAA", scaaData)
                    console.log(`🏆 ${scaaData.length} avaliações SCAA sincronizadas`)
                    setSyncStatus("success")
                },
                (error) => {
                    console.error("❌ Erro no listener de SCAA:", error)
                    setSyncStatus("error")
                },
            )

            // Cleanup function será chamada quando o usuário deslogar
            return () => {
                unsubscribeFornecedores()
                unsubscribeCOB()
                unsubscribeSCAA()
            }
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user)
            if (user) {
                console.log("👤 Usuário autenticado:", user.uid)
                loadDataFromCache(user.uid)
                if (isOnline) {
                    setupRealtimeListeners(user.uid)
                }
            } else {
                console.log("👤 Usuário deslogado")
                clearData()
            }
        })

        return () => unsubscribe()
    }, [isOnline, clearData])

    const value = {
        fornecedores,
        avaliacoesCOB,
        avaliacoesSCAA,
        loading,
        lastSync,
        refreshData,
        isOnline,
        syncStatus,
    }

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
