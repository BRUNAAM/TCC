"use client"
import { useState, useEffect, useCallback } from "react"

export function useLocalStorage(key, initialValue) {
    // Estado que sincroniza com localStorage
    const [storedValue, setStoredValue] = useState(() => {
        // ✅ INICIALIZANDO diretamente no useState para evitar problemas
        if (typeof window === "undefined") {
            return initialValue
        }
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            console.warn(`Erro ao ler localStorage key "${key}":`, error)
            return initialValue
        }
    })

    // Função para salvar no localStorage
    const setValue = useCallback(
        (value) => {
            try {
                // Permite que value seja uma função para consistência com useState
                const valueToStore = value instanceof Function ? value(storedValue) : value
                // Salva no estado
                setStoredValue(valueToStore)
                // Salva no localStorage
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(key, JSON.stringify(valueToStore))
                }
            } catch (error) {
                console.warn(`Erro ao salvar no localStorage key "${key}":`, error)
            }
        },
        [key, storedValue],
    )

    // ✅ EFEITO SIMPLIFICADO - só executa uma vez na montagem
    useEffect(() => {
        // Sincronizar com localStorage apenas na montagem do componente
        const syncWithStorage = () => {
            try {
                const item = window.localStorage.getItem(key)
                if (item) {
                    const parsedItem = JSON.parse(item)
                    setStoredValue(parsedItem)
                }
            } catch (error) {
                console.warn(`Erro ao sincronizar localStorage key "${key}":`, error)
            }
        }

        // Só executa se estivermos no browser
        if (typeof window !== "undefined") {
            syncWithStorage()
        }
    }, [key]) // ✅ Apenas 'key' como dependência

    return [storedValue, setValue]
}
