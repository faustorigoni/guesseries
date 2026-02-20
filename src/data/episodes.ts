export type Episode = {
  id: number
  number: number
  title: string
  description: string
  image: string
}

export const paquitaSalasEpisodes: Episode[] = [
  {
    id: 1,
    number: 1,
    title: "El comienzo",
    description: "Paquita Salas se enfrenta a su primer día como agente de talentos en Madrid. Conoce a sus primeros clientes y descubre los desafíos del mundo del espectáculo.",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop"
  },
  {
    id: 2,
    number: 2,
    title: "La primera crisis",
    description: "Cuando uno de sus clientes más importantes amenaza con dejarla, Paquita debe demostrar su valía como agente y encontrar una solución creativa.",
    image: "https://images.unsplash.com/photo-1517604931442-9e93c8e8b423?w=800&h=450&fit=crop"
  },
  {
    id: 3,
    number: 3,
    title: "El casting",
    description: "Paquita organiza un casting masivo para encontrar nuevos talentos. Las cosas se complican cuando aparecen más candidatos de los esperados.",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=450&fit=crop"
  },
  {
    id: 4,
    number: 4,
    title: "La gran oportunidad",
    description: "Una oportunidad única se presenta cuando una productora internacional busca representación en España. Paquita debe decidir si está lista para el gran salto.",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop"
  },
  {
    id: 5,
    number: 5,
    title: "El final del principio",
    description: "Después de todas las aventuras, Paquita reflexiona sobre su viaje y se prepara para nuevos desafíos en su carrera como agente de talentos.",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop"
  }
]
