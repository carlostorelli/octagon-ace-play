import { Zap, Trophy, Users, Shield, BarChart3, Swords } from "lucide-react";

export const MOCK_EVENTS = [
  {
    id: "1",
    name: "UFC 312",
    date: "2025-02-08",
    location: "Sydney, Australia",
    status: "completed" as const,
    fightsCount: 12,
    mainEvent: "Dricus du Plessis vs Sean Strickland",
  },
  {
    id: "2",
    name: "UFC Fight Night: Moreno vs Albazi",
    date: "2025-02-22",
    location: "Las Vegas, NV",
    status: "upcoming" as const,
    fightsCount: 11,
    mainEvent: "Brandon Moreno vs Amir Albazi",
  },
  {
    id: "3",
    name: "UFC 313",
    date: "2025-03-08",
    location: "Las Vegas, NV",
    status: "upcoming" as const,
    fightsCount: 13,
    mainEvent: "Alex Pereira vs Magomed Ankalaev",
  },
  {
    id: "4",
    name: "UFC Fight Night: Allen vs Craig",
    date: "2025-03-22",
    location: "London, England",
    status: "upcoming" as const,
    fightsCount: 12,
    mainEvent: "Arnold Allen vs Paul Craig",
  },
];

export const MOCK_FIGHTERS = [
  { id: "1", name: "Alex Pereira", nickname: "Poatan", weightClass: "Light Heavyweight", salary: 12000, record: "11-2-0", country: "🇧🇷" },
  { id: "2", name: "Islam Makhachev", nickname: "N/A", weightClass: "Lightweight", salary: 11500, record: "26-1-0", country: "🇷🇺" },
  { id: "3", name: "Jon Jones", nickname: "Bones", weightClass: "Heavyweight", salary: 13000, record: "27-1-0", country: "🇺🇸" },
  { id: "4", name: "Dricus du Plessis", nickname: "Stillknocks", weightClass: "Middleweight", salary: 10500, record: "22-2-0", country: "🇿🇦" },
  { id: "5", name: "Ilia Topuria", nickname: "El Matador", weightClass: "Featherweight", salary: 10000, record: "16-0-0", country: "🇪🇸" },
  { id: "6", name: "Merab Dvalishvili", nickname: "The Machine", weightClass: "Bantamweight", salary: 9000, record: "18-4-0", country: "🇬🇪" },
  { id: "7", name: "Leon Edwards", nickname: "Rocky", weightClass: "Welterweight", salary: 9500, record: "22-4-0", country: "🇬🇧" },
  { id: "8", name: "Sean O'Malley", nickname: "Sugar", weightClass: "Bantamweight", salary: 9000, record: "18-2-0", country: "🇺🇸" },
  { id: "9", name: "Max Holloway", nickname: "Blessed", weightClass: "Featherweight", salary: 9500, record: "26-7-0", country: "🇺🇸" },
  { id: "10", name: "Charles Oliveira", nickname: "Do Bronx", weightClass: "Lightweight", salary: 10000, record: "34-10-0", country: "🇧🇷" },
];

export const MOCK_LEAGUES = [
  { id: "1", name: "Octagon Masters", type: "public" as const, members: 128, maxMembers: 256, prizePool: "R$ 5.000", owner: "Carlos S." },
  { id: "2", name: "Brazilian Warriors", type: "public" as const, members: 64, maxMembers: 64, prizePool: "R$ 2.500", owner: "Ana P." },
  { id: "3", name: "KO Kings Private", type: "private" as const, members: 12, maxMembers: 20, prizePool: "R$ 1.000", owner: "João M." },
  { id: "4", name: "UFC Fanatics", type: "public" as const, members: 230, maxMembers: 500, prizePool: "R$ 10.000", owner: "Pedro L." },
];

export const MOCK_LEADERBOARD = [
  { rank: 1, user: "Carlos S.", points: 2450, wins: 8, avatar: "CS" },
  { rank: 2, user: "Ana P.", points: 2380, wins: 7, avatar: "AP" },
  { rank: 3, user: "João M.", points: 2210, wins: 7, avatar: "JM" },
  { rank: 4, user: "Pedro L.", points: 2100, wins: 6, avatar: "PL" },
  { rank: 5, user: "Maria R.", points: 1980, wins: 5, avatar: "MR" },
  { rank: 6, user: "Lucas F.", points: 1870, wins: 5, avatar: "LF" },
  { rank: 7, user: "Bruna T.", points: 1750, wins: 4, avatar: "BT" },
  { rank: 8, user: "Diego C.", points: 1680, wins: 4, avatar: "DC" },
  { rank: 9, user: "Fernanda G.", points: 1590, wins: 3, avatar: "FG" },
  { rank: 10, user: "Rafael N.", points: 1520, wins: 3, avatar: "RN" },
];

export const FEATURES = [
  { icon: Swords, title: "Escale Lutadores", desc: "Monte seu time com salary cap e estratégia" },
  { icon: Trophy, title: "Ligas & Rankings", desc: "Crie ligas públicas ou privadas com amigos" },
  { icon: Zap, title: "Pontuação em Tempo Real", desc: "Acompanhe seus pontos durante o evento" },
  { icon: BarChart3, title: "Estatísticas Avançadas", desc: "Análise detalhada de cada lutador" },
  { icon: Users, title: "Comunidade", desc: "Chat na liga, convites e desafios" },
  { icon: Shield, title: "Anti-Fraude", desc: "Sistema justo e transparente para todos" },
];

export const SCORING_RULES = [
  { action: "Vitória", points: 100 },
  { action: "KO/TKO", points: 150 },
  { action: "Finalização", points: 130 },
  { action: "Decisão Unânime", points: 80 },
  { action: "Knockdown", points: 40 },
  { action: "Queda (Takedown)", points: 30 },
  { action: "Controle de Grade", points: 20 },
  { action: "Tentativa de Finalização", points: 15 },
  { action: "Bônus Performance da Noite", points: 200 },
  { action: "Bônus Luta da Noite", points: 150 },
  { action: "Capitão (2x pontos)", points: 0 },
];
