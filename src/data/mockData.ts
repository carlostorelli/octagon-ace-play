import { Zap, Trophy, Users, Shield, BarChart3, Swords } from "lucide-react";

export const MOCK_EVENTS = [
  {
    id: "1",
    name: "UFC 324",
    date: "2026-01-24",
    location: "Las Vegas, NV",
    status: "completed" as const,
    fightsCount: 13,
    mainEvent: "Justin Gaethje vs Paddy Pimblett",
  },
  {
    id: "2",
    name: "UFC 325",
    date: "2026-01-31",
    location: "Sydney, Australia",
    status: "completed" as const,
    fightsCount: 12,
    mainEvent: "Alexander Volkanovski vs Diego Lopes 2",
  },
  {
    id: "3",
    name: "UFC Fight Night: Bautista vs Oliveira",
    date: "2026-02-08",
    location: "Las Vegas, NV (APEX)",
    status: "completed" as const,
    fightsCount: 11,
    mainEvent: "Mario Bautista vs Vinicius Oliveira",
  },
  {
    id: "4",
    name: "UFC Fight Night: Strickland vs Hernandez",
    date: "2026-02-21",
    location: "Houston, TX",
    status: "upcoming" as const,
    fightsCount: 12,
    mainEvent: "Sean Strickland vs Chris Hernandez",
  },
  {
    id: "5",
    name: "UFC Fight Night: Moreno vs Almabayev",
    date: "2026-02-28",
    location: "Cidade do México, México",
    status: "upcoming" as const,
    fightsCount: 12,
    mainEvent: "Brandon Moreno vs Zhalgas Almabayev",
  },
  {
    id: "6",
    name: "UFC 326",
    date: "2026-03-07",
    location: "Las Vegas, NV",
    status: "upcoming" as const,
    fightsCount: 14,
    mainEvent: "Max Holloway vs Charles Oliveira 2",
  },
];

export const MOCK_FIGHTERS = [
  { id: "1", name: "Max Holloway", nickname: "Blessed", weightClass: "Lightweight", salary: 13000, record: "27-8-0", country: "🇺🇸" },
  { id: "2", name: "Charles Oliveira", nickname: "Do Bronx", weightClass: "Lightweight", salary: 12500, record: "36-11-0", country: "🇧🇷" },
  { id: "3", name: "Justin Gaethje", nickname: "The Highlight", weightClass: "Lightweight", salary: 11500, record: "25-5-0", country: "🇺🇸" },
  { id: "4", name: "Paddy Pimblett", nickname: "The Baddy", weightClass: "Lightweight", salary: 9500, record: "22-4-0", country: "🇬🇧" },
  { id: "5", name: "Alexander Volkanovski", nickname: "The Great", weightClass: "Featherweight", salary: 12000, record: "26-4-0", country: "🇦🇺" },
  { id: "6", name: "Diego Lopes", nickname: "N/A", weightClass: "Featherweight", salary: 9000, record: "27-7-0", country: "🇧🇷" },
  { id: "7", name: "Sean Strickland", nickname: "Tarzan", weightClass: "Middleweight", salary: 10000, record: "29-7-0", country: "🇺🇸" },
  { id: "8", name: "Brandon Moreno", nickname: "The Assassin Baby", weightClass: "Flyweight", salary: 9500, record: "22-8-2", country: "🇲🇽" },
  { id: "9", name: "Caio Borralho", nickname: "N/A", weightClass: "Middleweight", salary: 8500, record: "17-2-0", country: "🇧🇷" },
  { id: "10", name: "Raul Rosas Jr", nickname: "N/A", weightClass: "Bantamweight", salary: 7500, record: "10-2-0", country: "🇺🇸" },
  { id: "11", name: "Mario Bautista", nickname: "N/A", weightClass: "Bantamweight", salary: 8000, record: "14-3-0", country: "🇺🇸" },
  { id: "12", name: "Rob Font", nickname: "N/A", weightClass: "Bantamweight", salary: 8500, record: "22-9-0", country: "🇺🇸" },
];

export const LEAGUE_INFO = {
  name: "Liga FantasyUFC",
  members: 42,
  description: "Liga única de fantasy MMA — acumule pontos e concorra a brindes no sorteio!",
};

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
  { icon: Trophy, title: "Ranking & Sorteio", desc: "Acumule pontos e concorra a brindes" },
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
