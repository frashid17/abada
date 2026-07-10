/** Server-only master template — Hoja de Términos Serie A (Colombian VC) */
export const termSheetMasterTemplate = `HOJA DE TÉRMINOS PARA LA FINANCIACIÓN DE ACCIONES PREFERENTES DE {{company_name}} S.A.S.

{{closing_month}} {{closing_day}}, {{closing_year}}

La presente Hoja de Términos resume los principales términos de la inversión en Acciones Preferentes por parte de {{lead_investor_name}} (el "Inversionista") en {{company_name}} S.A.S., una sociedad por acciones simplificada colombiana (la "Sociedad").

En consideración al tiempo y los gastos dedicados y que se dedicarán por parte de la Sociedad con respecto a esta inversión, las disposiciones de No Negociación/Confidencialidad de la presente Hoja de Términos serán obligaciones vinculantes para la Sociedad, se consuma o no la financiación. No se crearán otras obligaciones legalmente vinculantes hasta que los acuerdos definitivos sean ejecutados y entregados por todas las partes.

La presente Hoja de Términos no es un compromiso de emisión de acciones y está condicionada a la aprobación de la emisión por parte de la Junta Directiva de la Sociedad. Esta Hoja de Términos se regirá en todos los aspectos por las leyes de Colombia.

1. TÉRMINOS DE LA OFERTA

Fecha de Cierre: Tan pronto como sea posible después de la aceptación de esta Hoja de Términos por parte de la Sociedad y el cumplimiento de las Condiciones de Cierre (el "Cierre"). La fecha de cierre objetivo es el {{target_closing_date}}.

Inversionistas:
{{investor_schedule}}

Fundadores: {{founder_names}}.

Monto Máximo de Aportes: COP {{max_investment_cop}} que representará el {{investor_ownership_pct}}% del capital de la sociedad.

Precio por Acción: COP {{price_per_share_cop}} por acción (basado en la capitalización de la Sociedad establecida a continuación) (el "Precio de Compra Original").

Valoración Previa al Aporte (Post-Money): El Precio de Compra Original se basa en una valoración post-money totalmente diluida de COP {{post_money_valuation_cop}}.

Capitalización: La estructura de capital de la Sociedad antes y después del Cierre se establece en el Anexo A.

Uso de Recursos: Los fondos de la inversión deberán utilizarse únicamente para el desarrollo del plan de negocios, tal como este se describe en el Anexo B (el "Plan de Negocio").

2. DIVIDENDOS

Los dividendos se pagarán sobre las Acciones Preferentes sobre una base convertida cuando, según y si se paguen sobre cualquier otra serie de capital social. En cualquier caso, los accionistas acuerdan que la Sociedad no realizará una distribución de dividendos durante los {{dividend_lockup_years}} años siguientes a la emisión de las Acciones Preferentes.

3. LIQUIDACIÓN PREFERENTE

En caso de cualquier liquidación, disolución o terminación de la Sociedad, los fondos se pagarán de la siguiente manera: Primero se pagará {{liquidation_multiple}} veces del Precio de Compra Original (o, si es mayor, la cantidad que las Acciones Preferentes recibirían sobre una base convertida). En caso de coinversión, se distribuirá a prorrata a los tenedores de Acciones Ordinarias.

Una fusión o consolidación (que no sea aquella en la que los accionistas de la Sociedad posean una mayoría por poder de voto de las acciones en circulación de la sociedad sobreviviente o adquirente) y una venta, arrendamiento, transferencia, licencia exclusiva u otra disposición de la totalidad o sustancialmente la totalidad de los activos de la Sociedad se tratarán como un evento de liquidación (un "Evento de Liquidación"), lo que activará el pago de las preferencias de liquidación descritas anteriormente, a menos que los tenedores del {{liquidation_waiver_pct}}% de las Acciones Preferentes decidan lo contrario.

4. DERECHOS DE VOTO

Las Acciones Preferentes votarán junto con las Acciones Ordinarias sobre una base convertida, y no como una clase separada, excepto (i) las Acciones Preferentes como clase tendrán derecho a elegir un (1) miembro de la Junta Directiva (el "Director Inversionista") y (ii) según lo exija la ley.

Los estatutos de la Sociedad establecerán que el número de acciones ordinarias autorizadas podrá aumentarse o disminuirse con la aprobación de la mayoría de las Acciones Preferentes y Ordinarias, votando juntas como una sola clase, y sin una votación separada por clase de las Acciones Ordinarias.

Las Acciones Preferentes tendrán un voto por acción y las Acciones Ordinarias tendrán {{common_votes_per_share}} votos por acción.

5. MEDIDAS DE PROTECCIÓN A INVERSIONISTAS

Mientras haya Acciones Preferentes en circulación, además de cualquier otro voto o aprobación requerido bajo los estatutos de la Sociedad, la Sociedad no podrá, sin el consentimiento por escrito de la mayoría calificada, equivalente al {{protective_majority_pct}}% de las Acciones Preferentes de la Sociedad, ya sea directamente o por enmienda, fusión, consolidación u otra forma:

(i) liquidar, disolver o terminar los asuntos de la Sociedad, o efectuar cualquier fusión o consolidación o cualquier otro Evento de Liquidación;
(ii) enmendar, alterar o derogar cualquier disposición de los estatutos;
(iii) crear o autorizar la creación o emisión de cualquier otro valor convertible en o ejercitable por cualquier valor de capital con derechos, preferencias o privilegios superiores o en paridad con las Acciones Preferentes, o aumentar el número autorizado de acciones de las Acciones Preferentes;
(iv) recomprar o redimir acciones, o pagar cualquier dividendo sobre cualquier capital social antes de las Acciones Preferentes, salvo recompras a antiguos empleados o consultores al menor valor entre valor justo de mercado o costo;
(v) crear o autorizar deuda superior a COP {{debt_threshold_cop}} sin aprobación previa de la Junta Directiva, incluida la aprobación del Director elegido por las Acciones Preferentes;
(vi) crear o poseer capital social en cualquier subsidiaria que no sea de propiedad total, o disponer de capital social de subsidiaria o de activos sustanciales de cualquier subsidiaria;
(vii) aumentar o disminuir el tamaño de la Junta Directiva;
(viii) cambiar el negocio o la misión de la Sociedad de tal manera que el negocio principal ya no se persiga; o
(ix) aprobar cualquier plan de opciones sobre acciones para empleados u otro plan basado en acciones, o aumentar el número de acciones reservadas bajo dicho plan.

6. CONVERSIÓN OPCIONAL

Las Acciones Preferentes se convertirán inicialmente 1:1 en Acciones Ordinarias en cualquier momento a opción de su tenedor.

7. ACUERDO DE SUSCRIPCIÓN

Manifestaciones y garantías estándar y habituales por parte de la Sociedad e indemnizaciones habituales por parte de la Sociedad a favor del/de los Inversionista(s).

Condiciones de Cierre: Condiciones estándar para el Cierre, que incluirán, entre otras cosas: (i) finalización satisfactoria de la debida diligencia financiera y legal; (ii) recepción de todas las autorizaciones, aprobaciones y consentimientos requeridos; (iii) modificación de los estatutos para establecer los derechos y preferencias de las Acciones Preferentes; (iv) ejecución de acuerdos definitivos habituales, incluyendo acuerdo de suscripción y acuerdo de accionistas; (v) ejecución de los Acuerdos de No Competencia; (vi) ausencia de cambios adversos materiales en la Sociedad.

Asesoría y Gastos: Cada parte asumirá los gastos relacionados con los costos legales y administrativos de la financiación al Cierre, incluyendo los costos de la debida diligencia.

8. DERECHOS DE GESTIÓN E INFORMACIÓN

Los Inversionistas tendrán acceso a las instalaciones y al personal de la Sociedad durante el horario comercial normal y con notificación previa razonable. La Sociedad entregará a dicho Inversionista (i) información anual, trimestral y otra según lo determine la Junta Directiva; (ii) treinta días antes del fin de cada año fiscal, un presupuesto operativo integral y un plan de negocios; y (iii) puntualmente después del fin de cada trimestre, una tabla de capitalización actualizada.

9. DERECHO A PARTICIPAR EN RONDAS FUTURAS

Los Inversionistas y los Fundadores tendrán un derecho pro rata, basado en su porcentaje de participación accionaria (asumiendo la conversión de todas las Acciones Preferentes en circulación y el ejercicio de todas las opciones en circulación), para participar en emisiones subsiguientes de valores de capital de la Sociedad. Si algún Inversionista decide no comprar su participación pro rata completa, el/los Inversionista(s) restante(s) tendrá(n) derecho a comprar las participaciones pro rata restantes.

10. MAYORÍA ESPECIAL Y NO COMPETENCIA

La Sociedad no podrá, sin el voto afirmativo de al menos {{board_supermajority_count}} de los {{board_size}} miembros de la junta directiva: (i) contratar, despedir o cambiar la remuneración en más del {{ceo_comp_change_pct}}% anual del Director Ejecutivo o cualquier otro funcionario ejecutivo con paquete superior a COP {{executive_comp_threshold_cop}} anuales, incluyendo la aprobación de cualquier otorgamiento de opciones; (ii) aprobar el presupuesto anual de la Sociedad; y (iii) contratar o cambiar a los auditores de la Sociedad.

Cada Fundador y empleado clave celebrará un acuerdo de no competencia y no solicitud por {{non_compete_years}} años en una forma razonablemente aceptable para los Inversionistas (los "Acuerdos de No Competencia").

11. PRIMERA OFERTA Y DERECHO DE ACOMPAÑAMIENTO

Si alguno de los accionistas propone vender o transferir acciones (las "Acciones de Transferencia"), todos los accionistas restantes tendrán derecho a hacer una oferta por la totalidad o una parte de las Acciones de Transferencia de forma pro rata.

En caso de (i) una venta o transferencia propuesta de acciones por parte de cualquier tenedor de Acciones Preferentes y/o (ii) una transacción propuesta en la que se transfiera el {{control_transfer_pct}}% o más del poder de voto de la Sociedad, cada Inversionista y cada Fundador tendrá derecho a participar en dicha venta de forma pro rata.

12. JUNTA DIRECTIVA

Al Cierre inicial, la Junta Directiva estará compuesta por {{board_size}} Directores: {{board_investor_seats}} inversionistas y {{board_founder_seats}} fundadores.

13. CLÁUSULA DE ARRASTRE

Todos los accionistas deberán acordar que venderán y votarán sus acciones a favor de un Evento de Liquidación o una transacción en la que se transfiera el 100% de las acciones de la Sociedad y que sea aprobada por (i) la Junta Directiva y (ii) al menos el {{drag_along_threshold_pct}}% de las Acciones Ordinarias y Acciones Preferentes (sobre una base convertida) votando conjuntamente (los "Tenedores Elegibles").

14. DERECHOS DE LIQUIDEZ

Previa notificación por escrito a la Sociedad por parte de al menos el {{liquidity_trigger_pct}}% de las Acciones Preferentes, la Sociedad iniciará un proceso para proporcionar una oportunidad de salida para los Inversionistas siete (7) años después de la Fecha de Cierre (el "Derecho de Liquidez").

Del año siete (7) al diez (10) de la Fecha de Cierre, la Sociedad estará obligada a contratar un banco de inversión de buena reputación para identificar una oportunidad de salida adecuada. Si al final del año diez (10) no ha habido un evento de liquidez, los accionistas se comprometerán a ofrecer vender al menos una participación del {{demand_sale_pct}}% de la Sociedad (una "Salida por Demanda"), sujeta a retornos mínimos equivalentes a una TIR anual del {{liquidity_irr_pct}}% o {{liquidity_multiple}} veces el Precio de Compra Original.

15. OTROS ASUNTOS

Restricción de Venta: Mientras las Acciones Preferentes estén en circulación, a los Fundadores no se les permitirá transferir ninguna de sus acciones sin el permiso del Inversionista, excepto transferencias a afiliados y otros cesionarios permitidos.

Confidencialidad: La Sociedad no divulgará los términos de esta Hoja de Términos sin el consentimiento por escrito del Inversionista principal, salvo a funcionarios, miembros de la Junta Directiva, contadores, abogados y otros posibles inversionistas aceptables.

Fecha de Expiración: Esta Hoja de Términos tendrá una vigencia de {{term_sheet_validity_months}} meses.`;
