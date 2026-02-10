import { useState } from "react";
import { motion } from "framer-motion";
import { Swords, User, Weight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { OSSInput } from "@/components/ui/oss-input";

const InputShowcase = () => {
  const [searchVal, setSearchVal] = useState("");

  return (
    <AppLayout>
      <div className="container py-8 space-y-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">
            Componentes de Input
          </h1>
          <p className="text-muted-foreground">OSS Fantasy Design System</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Default variants */}
          <div className="glass-card rounded-xl p-6 space-y-6">
            <h2 className="font-display text-lg font-bold uppercase text-primary">
              Variantes
            </h2>

            <OSSInput
              label="Lutador A"
              placeholder="Ex.: Max Holloway"
              showBrand
              helperText="Selecione o lutador principal"
            />

            <OSSInput
              variant="search"
              label="Buscar Lutador"
              placeholder="Buscar lutador..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />

            <OSSInput
              variant="numeric"
              label="Salary Cap"
              placeholder="50000"
              type="number"
              helperText="Valor máximo de salário"
            />
          </div>

          {/* States */}
          <div className="glass-card rounded-xl p-6 space-y-6">
            <h2 className="font-display text-lg font-bold uppercase text-primary">
              Estados
            </h2>

            <OSSInput
              label="Lutador B"
              placeholder="Ex.: Charles Oliveira"
              prefixIcon={User}
            />

            <OSSInput
              label="Categoria"
              placeholder="Lightweight"
              prefixIcon={Weight}
              errorMessage="Categoria inválida para este evento"
            />

            <OSSInput
              label="Escalação Confirmada"
              defaultValue="Alex Pereira"
              showBrand
              successMessage="Lutador escalado com sucesso"
            />

            <OSSInput
              label="Bloqueado"
              placeholder="Evento finalizado"
              disabled
            />
          </div>

          {/* Sizes */}
          <div className="glass-card rounded-xl p-6 space-y-6">
            <h2 className="font-display text-lg font-bold uppercase text-primary">
              Tamanhos
            </h2>

            <OSSInput inputSize="sm" label="Compact (Sidebar)" placeholder="Buscar..." variant="search" />
            <OSSInput inputSize="md" label="Regular (Padrão)" placeholder="Nome do lutador" showBrand />
            <OSSInput inputSize="lg" label="Large (Destaque)" placeholder="Buscar evento ou lutador..." variant="search" />
          </div>

          {/* With custom icons */}
          <div className="glass-card rounded-xl p-6 space-y-6">
            <h2 className="font-display text-lg font-bold uppercase text-primary">
              Ícones Customizados
            </h2>

            <OSSInput
              label="Luta Principal"
              placeholder="Ex.: Holloway vs Oliveira"
              prefixIcon={Swords}
              helperText="Main event do card"
            />

            <OSSInput
              label="Com Marca OSS"
              placeholder="Fantasy UFC input"
              prefixIcon="glove"
              helperText="Ícone de luvinha como prefixo"
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default InputShowcase;
