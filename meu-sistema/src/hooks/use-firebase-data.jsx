"use client"

import { useState, useEffect } from "react"
import { getAuth } from "firebase/auth"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "../config/firebase"

export function useFirebaseData() {
    const [avaliacoesSalvas, setAvaliacoesSalvas] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const carregarAvaliacoesSalvas = async () => {
            try {
                const auth = getAuth()
                const user = auth.currentUser

                if (!user) {
                    setLoading(false)
                    return
                }

                // Buscar as últimas avaliações salvas
                const q = query(
                    collection(db, "usuarios", user.uid, "avaliacoes_scaa"),
                    orderBy("dataCriacao", "desc"),
                    limit(10),
                )

                const querySnapshot = await getDocs(q)
                const avaliacoes = []

                querySnapshot.forEach((doc) => {
                    avaliacoes.push({
                        id: doc.id,
                        ...doc.data(),
                    })
                })

                setAvaliacoesSalvas(avaliacoes)
            } catch (error) {
                console.error("Erro ao carregar avaliações:", error)
            } finally {
                setLoading(false)
            }
        }

        carregarAvaliacoesSalvas()
    }, []) // ✅ Array vazio está correto aqui

    return { avaliacoesSalvas, loading }
}
