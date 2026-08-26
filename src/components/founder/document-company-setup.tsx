"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  usePrototypeDocumentStore,
  type PrototypeCompany,
} from "@/lib/documents/prototype/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DocumentCompanySetup() {
  const t = useTranslations("founder.documentsPrototype");
  const router = useRouter();
  const { store, hydrated, persist } = usePrototypeDocumentStore();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const company: PrototypeCompany = {
      nombre: String(form.get("nombre") ?? ""),
      nit: String(form.get("nit") ?? ""),
      domicilio: String(form.get("domicilio") ?? ""),
      ciudad: String(form.get("ciudad") ?? ""),
      negocio: String(form.get("negocio") ?? ""),
      fecha: String(form.get("fecha") ?? ""),
      repLegal: String(form.get("repLegal") ?? ""),
      repCargo: String(form.get("repCargo") ?? ""),
      colab: String(form.get("colab") ?? ""),
      colabId: String(form.get("colabId") ?? ""),
    };
    persist({
      ...store,
      company,
      founders: [
        {
          ...store.founders[0]!,
          nombre: String(form.get("f1nombre") ?? ""),
          id: String(form.get("f1id") ?? ""),
          domicilio: String(form.get("f1domicilio") ?? ""),
          rol: String(form.get("f1rol") ?? ""),
        },
        {
          ...store.founders[1]!,
          nombre: String(form.get("f2nombre") ?? ""),
          id: String(form.get("f2id") ?? ""),
          domicilio: String(form.get("f2domicilio") ?? ""),
          rol: String(form.get("f2rol") ?? ""),
        },
      ],
    });
    router.push("/fundador/documentos");
  }

  if (!hydrated) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  return (
    <form className="mx-auto max-w-[900px] space-y-6 pb-16" onSubmit={save}>
      <div>
        <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-highlight">
          {t("setup")}
        </p>
        <h1 className="mt-2.5 font-serif text-[34px] font-semibold tracking-tight">
          {t("setupOnceH1")}
        </h1>
        <p className="mt-3 max-w-[62ch] text-[16.5px] leading-relaxed text-[color:var(--ink-2)]">
          {t("setupLede")}
        </p>
      </div>

      <section className="rounded-[14px] border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="font-serif text-xl font-semibold">{t("setupCompanyHeading")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("setupCompanySub")}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            id="nombre"
            label={t("registeredName")}
            hint={t("registeredNameHint")}
            defaultValue={store.company.nombre}
            placeholder="Acme Colombia"
          />
          <Field id="nit" label={t("nit")} defaultValue={store.company.nit} placeholder="900.000.000-1" />
          <Field
            id="domicilio"
            label={t("address")}
            defaultValue={store.company.domicilio}
            placeholder="Calle 93 # 11-27, Bogotá"
          />
          <Field
            id="ciudad"
            label={t("city")}
            hint={t("cityHint")}
            defaultValue={store.company.ciudad}
            placeholder="Bogotá D.C."
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="negocio">{t("business")}</Label>
            <Input
              id="negocio"
              name="negocio"
              defaultValue={store.company.negocio}
              placeholder="una plataforma de pagos para comercios pequeños"
            />
            <p className="text-[12.5px] text-muted-foreground">{t("businessHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fecha">{t("effectiveDate")}</Label>
            <Input id="fecha" name="fecha" type="date" defaultValue={store.company.fecha} />
            <p className="text-[12.5px] text-muted-foreground">{t("effectiveDateHint")}</p>
          </div>
          <Field id="repLegal" label={t("repLegal")} defaultValue={store.company.repLegal} />
          <Field
            id="repCargo"
            label={t("repTitle")}
            defaultValue={store.company.repCargo}
            placeholder="Gerente general"
          />
        </div>
      </section>

      {[0, 1].map((index) => (
        <section
          key={index}
          className="rounded-[14px] border border-border bg-rail p-5 shadow-sm sm:p-6"
        >
          <h2 className="font-serif text-xl font-semibold">{t("founder", { n: index + 1 })}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("setupFounderSub")}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              id={`f${index + 1}nombre`}
              label={t("fullName")}
              defaultValue={store.founders[index]?.nombre ?? ""}
            />
            <Field
              id={`f${index + 1}id`}
              label={t("idNumber")}
              defaultValue={store.founders[index]?.id ?? ""}
              placeholder="C.C. 1.000.000.000"
            />
            <Field
              id={`f${index + 1}domicilio`}
              label={t("founderAddress")}
              defaultValue={store.founders[index]?.domicilio ?? ""}
            />
            <Field
              id={`f${index + 1}rol`}
              label={t("founderRole")}
              defaultValue={store.founders[index]?.rol ?? ""}
              placeholder="CEO, producto y comercial"
            />
          </div>
        </section>
      ))}

      <section className="rounded-[14px] border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="font-serif text-xl font-semibold">{t("setupIpHeading")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("setupIpSub")}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field id="colab" label={t("ipSignerName")} defaultValue={store.company.colab ?? ""} />
          <Field id="colabId" label={t("ipSignerId")} defaultValue={store.company.colabId ?? ""} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/fundador/documentos">{t("back")}</Link>
        </Button>
        <Button type="submit" variant="cta">
          {t("setupSave")}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  defaultValue,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} defaultValue={defaultValue} placeholder={placeholder} />
      {hint ? <p className="text-[12.5px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
