/* ========================================
   DIAGNÓSTICO KAIROS - Lógica de la encuesta
   3 preguntas de contexto + 1 captura de contacto + 17 preguntas de
   diagnóstico (20 en total) -> 12 dimensiones ponderadas -> puntaje 0-100.
   Modelo de puntaje adaptado del cuestionario "company_v1".
   Todo corre en el navegador, sin envío a servidor.
   ======================================== */

(function () {
    'use strict';

    // --- Dimensiones y sus pesos (suman 110; el total es la suma
    // ponderada de puntaje-por-dimensión dividida entre 100, no entre
    // la suma de pesos) ---
    var DIMENSIONS = {
        estrategia: { label: 'Estrategia', weight: 12, icon: 'fa-chess', desc: 'Si existen objetivos claros para implementar IA o todavía es una idea suelta.' },
        datos: { label: 'Datos', weight: 12, icon: 'fa-database', desc: 'Dónde vive la información de la empresa y qué tan lista está para alimentar un sistema.' },
        casosDeUso: { label: 'Casos de uso', weight: 10, icon: 'fa-lightbulb', desc: 'Qué tan claro está el problema que la IA debería resolver primero.' },
        procesos: { label: 'Procesos', weight: 10, icon: 'fa-diagram-project', desc: 'Si los procesos clave están documentados, medidos y son consistentes.' },
        talento: { label: 'Talento', weight: 10, icon: 'fa-graduation-cap', desc: 'Cuánta formación en IA ha recibido el equipo.' },
        gobierno: { label: 'Gobierno', weight: 10, icon: 'fa-shield-halved', desc: 'Reglas y responsables sobre qué herramientas y datos se pueden usar.' },
        liderazgo: { label: 'Liderazgo', weight: 8, icon: 'fa-user-tie', desc: 'Quién lidera la adopción de IA dentro de la empresa.' },
        tecnologia: { label: 'Tecnología', weight: 8, icon: 'fa-toolbox', desc: 'Si los sistemas actuales pueden integrarse entre sí y con IA.' },
        adopcion: { label: 'Adopción', weight: 8, icon: 'fa-seedling', desc: 'Cuánta gente del equipo ya usa IA en el día a día.' },
        seguridad: { label: 'Seguridad', weight: 6, icon: 'fa-lock', desc: 'Cómo se protege la información confidencial de la empresa.' },
        medicion: { label: 'Medición', weight: 4, icon: 'fa-chart-line', desc: 'Si se mide el impacto real de la tecnología que ya se usa.' },
        escalabilidad: { label: 'Escalabilidad', weight: 2, icon: 'fa-arrow-trend-up', desc: 'Cuántos pilotos de IA existen y si ya llegaron a producción.' }
    };

    var DIM_ORDER = ['estrategia', 'datos', 'casosDeUso', 'procesos', 'talento', 'gobierno', 'liderazgo', 'tecnologia', 'adopcion', 'seguridad', 'medicion', 'escalabilidad'];

    var SECTIONS = {
        'Motivación': { icon: 'fa-lightbulb', desc: 'Por qué tu empresa está considerando IA.' },
        'Estrategia y liderazgo': { icon: 'fa-chess', desc: 'Si hay una hoja de ruta y alguien a cargo de ella.' },
        'Uso actual': { icon: 'fa-bolt', desc: 'Cómo y cuánto usa tu equipo la IA hoy.' },
        'Procesos': { icon: 'fa-diagram-project', desc: 'Qué tan documentados y consistentes están tus procesos clave.' },
        'Datos': { icon: 'fa-database', desc: 'Dónde vive la información de tu empresa y qué tan lista está.' },
        'Tecnología': { icon: 'fa-toolbox', desc: 'Si tus sistemas actuales pueden integrarse entre sí.' },
        'Personas y adopción': { icon: 'fa-graduation-cap', desc: 'Cuánta formación en IA ha recibido tu equipo.' },
        'Gobierno y seguridad': { icon: 'fa-shield-halved', desc: 'Reglas sobre el uso de IA y la información confidencial.' },
        'Medición y escalabilidad': { icon: 'fa-chart-line', desc: 'Si mides el impacto y qué tan lejos han llegado tus pilotos.' }
    };

    // Escala 5 puntos con valores no lineales (usada en preguntas de "opción única" de 5 niveles)
    var SCALE5_POINTS = [0, 1.25, 2.5, 3.75, 5];

    // --- Preguntas de contexto: no puntúan ---
    var CONTEXT_QUESTIONS = [
        {
            id: 'relacion', type: 'choice', icon: 'fa-id-badge', sectionLabel: 'Contexto',
            title: '¿Cuál es tu relación con la empresa?',
            desc: 'Así sabemos desde qué posición estás viendo los procesos que vamos a evaluar.',
            options: ['Dueño o socio', 'Gerente general', 'Director', 'Gerente de área', 'Líder de transformación o innovación', 'Tecnología o sistemas', 'Operaciones', 'Consultor externo', 'Colaborador', 'Otro']
        },
        {
            id: 'industria', type: 'select', icon: 'fa-industry', sectionLabel: 'Contexto',
            title: '¿En qué industria opera tu empresa?',
            desc: 'Cada industria mueve procesos y datos de forma distinta, y eso cambia qué automatizar primero.',
            options: ['Construcción', 'Inmobiliaria', 'Retail', 'Educación', 'Salud', 'Servicios profesionales', 'Legal', 'Finanzas', 'Seguros', 'Manufactura', 'Logística', 'Turismo', 'Tecnología', 'Marketing', 'RRHH', 'Agricultura', 'Minería', 'Energía', 'Gobierno', 'Otro']
        },
        {
            id: 'tamano', type: 'choice', icon: 'fa-users-line', sectionLabel: 'Contexto',
            title: '¿Cuántas personas trabajan en la empresa?',
            desc: 'El tamaño del equipo cambia qué tan rápido se puede adoptar un sistema nuevo.',
            options: ['1', '2-10', '11-20', '21-50', '51-100', '101-250', '251-500', '+500']
        }
    ];

    var LEAD_STEP = {
        icon: 'fa-envelope', sectionLabel: 'Contexto',
        title: 'Guarda tu avance y recibe tu reporte',
        desc: 'Con tu nombre y correo te enviamos el diagnóstico completo apenas termines.'
    };

    // --- Las 17 preguntas que sí puntúan (numeración 4-20, igual que el cuestionario original) ---
    var QUESTIONS = [
        {
            num: 4, section: 'Motivación', dims: ['casosDeUso'], type: 'text',
            text: 'Describe el principal problema que te gustaría resolver con IA.',
            guide: 'Cuanto más detalle des —qué pasa hoy, quién participa, qué herramientas usan y dónde se pierde tiempo o dinero—, mejor podremos priorizar tus casos de uso.'
        },
        {
            num: 5, section: 'Estrategia y liderazgo', dims: ['estrategia'], type: 'single',
            text: '¿Tienes objetivos definidos para implementar IA en tu empresa?',
            options: [
                { label: 'No', points: 0 },
                { label: 'Explorando', points: 1 },
                { label: 'Algunas ideas', points: 2 },
                { label: 'Casos de uso priorizados', points: 3 },
                { label: 'Estrategia formal', points: 4 },
                { label: 'Estrategia vinculada a objetivos de negocio', points: 5 }
            ]
        },
        {
            num: 6, section: 'Estrategia y liderazgo', dims: ['liderazgo'], type: 'single',
            text: '¿Quién es responsable de liderar la adopción de IA en tu empresa?',
            options: [
                { label: 'Nadie', points: 0 },
                { label: 'Repartido informalmente', points: 1 },
                { label: 'Responsable parcial', points: 2 },
                { label: 'Líder definido', points: 3 },
                { label: 'Equipo o comité', points: 4 },
                { label: 'Estructura formal con presupuesto', points: 5 }
            ]
        },
        {
            num: 7, section: 'Uso actual', dims: ['casosDeUso', 'adopcion'], type: 'multi',
            text: '¿Cómo usa tu empresa la IA hoy? Marca todo lo que aplique.',
            options: [
                { label: 'No utiliza', level: 0 },
                { label: 'Otro', level: 0 },
                { label: 'Uso individual de ChatGPT u otras', level: 1 },
                { label: 'Contenido', level: 2 },
                { label: 'Análisis de documentos', level: 2 },
                { label: 'Servicio al cliente', level: 2 },
                { label: 'Ventas', level: 2 },
                { label: 'Desarrollo de software', level: 2 },
                { label: 'Automatización', level: 3 },
                { label: 'Análisis de datos', level: 3 },
                { label: 'Asistentes internos', level: 3 },
                { label: 'Agentes especializados', level: 4 },
                { label: 'Procesos integrados con sistemas internos', level: 5 }
            ]
        },
        {
            num: 8, section: 'Uso actual', dims: ['adopcion'], type: 'single',
            text: '¿Cuántas personas de tu equipo usan IA con frecuencia?',
            options: [
                { label: 'Nadie', points: 0 },
                { label: 'Menos de 10%', points: 1 },
                { label: '10% a 25%', points: 2 },
                { label: '26% a 50%', points: 3 },
                { label: '51% a 75%', points: 4 },
                { label: 'Más de 75%', points: 5 },
                { label: 'No lo sabemos', points: 0 }
            ]
        },
        {
            num: 9, section: 'Uso actual', dims: ['gobierno', 'adopcion'], type: 'single',
            text: 'Las herramientas de IA que usa el equipo, ¿las elige cada quien o la empresa?',
            options: [
                { label: 'Cada quien elige la suya', points: 0 },
                { label: 'Recomendaciones informales', points: 1.25 },
                { label: 'Herramientas aprobadas', points: 2.5 },
                { label: 'Licencias empresariales', points: 3.75 },
                { label: 'Catálogo y proceso de aprobación', points: 5 }
            ]
        },
        {
            num: 10, section: 'Procesos', dims: ['procesos'], type: 'single',
            text: '¿Tus procesos principales están documentados?',
            options: [
                { label: 'No', points: 0 },
                { label: 'Solo algunos', points: 1.25 },
                { label: 'Los críticos', points: 2.5 },
                { label: 'La mayoría', points: 3.75 },
                { label: 'Documentados, medidos y mejorados', points: 5 }
            ]
        },
        {
            num: 11, section: 'Procesos', dims: ['procesos'], type: 'text',
            text: 'Describe un proceso de tu empresa que debería funcionar mejor.',
            guide: 'Explica cómo funciona hoy, quién participa, qué herramientas usan y dónde se generan demoras o errores.'
        },
        {
            num: 12, section: 'Datos', dims: ['datos'], type: 'multi',
            text: '¿Dónde está la información de tu empresa? Marca todo lo que aplique.',
            options: [
                { label: 'No lo sabemos', level: 0 },
                { label: 'Correos', level: 1 },
                { label: 'WhatsApp', level: 1 },
                { label: 'Dispersa, sin un lugar fijo', level: 1 },
                { label: 'Excel', level: 2 },
                { label: 'Google Sheets', level: 2 },
                { label: 'Documentos sueltos', level: 2 },
                { label: 'Carpetas compartidas', level: 3 },
                { label: 'Google Drive', level: 3 },
                { label: 'Microsoft 365', level: 3 },
                { label: 'Software especializado', level: 3 },
                { label: 'Sistemas internos', level: 3 },
                { label: 'CRM', level: 4 },
                { label: 'ERP', level: 4 },
                { label: 'Bases de datos', level: 4 }
            ]
        },
        {
            num: 13, section: 'Datos', dims: ['datos'], type: 'scale5',
            text: '¿Qué tan estructurada y actualizada está esa información?',
            scaleLabels: ['Nada', 'Poco', 'Algo', 'Bastante', 'Totalmente']
        },
        {
            num: 14, section: 'Datos', dims: ['datos', 'tecnologia'], type: 'single',
            text: '¿Tus sistemas intercambian información entre sí de forma automática (API)?',
            options: [
                { label: 'No lo sabemos', points: 0 },
                { label: 'No', points: 0 },
                { label: 'Algunos', points: 2.5 },
                { label: 'La mayoría', points: 4 },
                { label: 'Arquitectura de integración definida', points: 5 }
            ]
        },
        {
            num: 15, section: 'Tecnología', dims: ['tecnologia'], type: 'single',
            text: '¿Con qué personal técnico cuentas para hacer integraciones?',
            options: [
                { label: 'Con ninguno', points: 0 },
                { label: 'Proveedores externos', points: 1 },
                { label: 'Una persona técnica', points: 2 },
                { label: 'Equipo de tecnología', points: 3 },
                { label: 'Equipo de datos o IA', points: 4 },
                { label: 'Equipo multidisciplinario', points: 5 }
            ]
        },
        {
            num: 16, section: 'Personas y adopción', dims: ['talento'], type: 'single',
            text: '¿Tu empresa ha hecho capacitaciones en IA?',
            options: [
                { label: 'No', points: 0 },
                { label: 'Charlas aisladas', points: 1.25 },
                { label: 'Talleres para algunos equipos', points: 2.5 },
                { label: 'Programa estructurado', points: 3.75 },
                { label: 'Formación continua vinculada a casos de uso', points: 5 }
            ]
        },
        {
            num: 17, section: 'Gobierno y seguridad', dims: ['gobierno'], type: 'single',
            text: '¿Existe una política interna sobre el uso de IA?',
            options: [
                { label: 'No', points: 0 },
                { label: 'En preparación', points: 1.25 },
                { label: 'Recomendaciones informales', points: 2.5 },
                { label: 'Política aprobada', points: 3.75 },
                { label: 'Política con responsables y controles', points: 5 }
            ]
        },
        {
            num: 18, section: 'Gobierno y seguridad', dims: ['seguridad'], type: 'single',
            text: '¿Cómo se gestiona la información confidencial de la empresa?',
            options: [
                { label: 'Sin criterio definido', points: 0 },
                { label: 'Depende de cada persona', points: 1.25 },
                { label: 'Hay recomendaciones', points: 2.5 },
                { label: 'Controles y herramientas aprobadas', points: 3.75 },
                { label: 'Controles técnicos, legales y auditoría', points: 5 }
            ]
        },
        {
            num: 19, section: 'Medición y escalabilidad', dims: ['medicion'], type: 'single',
            text: '¿Cómo mides el impacto de la tecnología que ya usas?',
            options: [
                { label: 'No se mide', points: 0 },
                { label: 'De forma cualitativa', points: 1 },
                { label: 'Horas ahorradas', points: 2 },
                { label: 'Costos, productividad o ventas', points: 3 },
                { label: 'KPIs y caso de negocio por proyecto', points: 4 },
                { label: 'Portafolio con seguimiento', points: 5 }
            ]
        },
        {
            num: 20, section: 'Medición y escalabilidad', dims: ['escalabilidad'], type: 'single',
            text: '¿Cuántos pilotos de IA ha implementado tu empresa?',
            options: [
                { label: 'Ninguno', points: 0 },
                { label: 'Evaluando uno', points: 1 },
                { label: 'Un piloto', points: 2 },
                { label: 'Varios pilotos', points: 3 },
                { label: 'Algunos en producción', points: 4 },
                { label: 'IA en procesos críticos', points: 5 }
            ]
        }
    ];

    // Catálogo de casos de uso: cada uno depende principalmente de una dimensión.
    var USE_CASE_CATALOG = [
        { dim: 'casosDeUso', title: 'Piloto enfocado en el problema que describiste', desc: 'Convierte el problema que compartiste al inicio en un piloto acotado y medible.' },
        { dim: 'estrategia', title: 'Hoja de ruta de IA a 90 días', desc: 'Prioriza 2 o 3 casos de uso con impacto claro y un orden de implementación realista.' },
        { dim: 'datos', title: 'Dashboard centralizado de la información clave del negocio', desc: 'Reemplaza el ir y venir de hojas de cálculo por una sola fuente de verdad.' },
        { dim: 'datos', title: 'Limpieza y consolidación de tu base de datos principal', desc: 'Unifica y depura la información para que cualquier automatización futura parta de datos confiables.' },
        { dim: 'procesos', title: 'Mapeo del proceso que más tiempo te quita', desc: 'Convierte ese proceso en un flujo con pasos, responsables y entregas claras, listo para automatizar.' },
        { dim: 'tecnologia', title: 'Integración entre tus sistemas actuales', desc: 'Conecta lo que ya usas (CRM, ERP, WhatsApp) para eliminar el trabajo manual de copiar información.' },
        { dim: 'talento', title: 'Capacitación práctica de IA para tu equipo', desc: 'Un taller aplicado a casos reales del negocio, no una charla genérica sobre IA.' },
        { dim: 'liderazgo', title: 'Un responsable claro de la adopción de IA', desc: 'Designa a alguien, aunque sea part-time, para que la iniciativa no se diluya entre el día a día.' },
        { dim: 'adopcion', title: 'Piloto pequeño y visible en un área con baja resistencia', desc: 'Genera evidencia y confianza antes de pedirle al resto del equipo que cambie su forma de trabajar.' },
        { dim: 'gobierno', title: 'Política básica de uso de herramientas de IA', desc: 'Define qué herramientas están aprobadas y quién las autoriza antes de que cada quien use la que quiera.' },
        { dim: 'seguridad', title: 'Reglas de acceso a información sensible', desc: 'Define quién puede ver, compartir o exportar datos confidenciales antes de automatizar procesos que los usan.' },
        { dim: 'medicion', title: 'Panel simple de impacto por piloto', desc: 'Registra horas ahorradas, errores evitados o ventas generadas por cada iniciativa de IA.' },
        { dim: 'escalabilidad', title: 'Llevar tu piloto actual a producción', desc: 'Antes de sumar más pruebas, consolida la que ya funciona y documenta cómo escalarla.' }
    ];

    var LEVEL_LABELS = [
        { max: 20, label: 'Inicial', desc: 'La IA es todavía una idea suelta. Hace falta construir las bases antes de automatizar.' },
        { max: 40, label: 'Exploración', desc: 'Hay intentos aislados, pero sin objetivos, datos ni procesos que los sostengan.' },
        { max: 60, label: 'En desarrollo', desc: 'Hay bases parciales en varias dimensiones, pero aún dispersas y sin dueño claro.' },
        { max: 80, label: 'Integrado', desc: 'La IA ya forma parte de cómo opera la empresa, con procesos y datos que la sostienen.' },
        { max: 100.01, label: 'Avanzado', desc: 'La empresa tiene estrategia, datos, talento y gobierno alineados para escalar IA con confianza.' }
    ];

    function getLevel(score) {
        for (var i = 0; i < LEVEL_LABELS.length; i++) {
            if (score <= LEVEL_LABELS[i].max) return LEVEL_LABELS[i];
        }
        return LEVEL_LABELS[LEVEL_LABELS.length - 1];
    }

    // --- Heurística local para calificar respuestas de texto libre (0-5) ---
    // No es una rúbrica de IA en vivo: es una estimación por nivel de detalle,
    // ya que el diagnóstico corre enteramente en el navegador, sin backend.
    function scoreFreeText(text) {
        text = (text || '').trim();
        if (!text) return 0;
        var words = text.split(/\s+/).filter(Boolean);
        var n = words.length;
        if (n <= 1) return 0;
        if (n <= 4) return 1;
        if (n <= 10) return 2;
        if (n <= 25) return 3;
        if (n <= 50) return 4;
        return 5;
    }

    // --- Construcción de la lista de pasos del wizard ---
    // Contexto (3) -> pregunta 4 -> captura de contacto -> preguntas 5-20 (16)
    var STEPS = [];
    CONTEXT_QUESTIONS.forEach(function (cq) { STEPS.push({ type: 'context', data: cq }); });
    STEPS.push({ type: 'question', data: QUESTIONS[0] });
    STEPS.push({ type: 'lead', data: LEAD_STEP });
    for (var qi = 1; qi < QUESTIONS.length; qi++) {
        STEPS.push({ type: 'question', data: QUESTIONS[qi] });
    }
    var TOTAL_STEPS = STEPS.length;

    // --- Estado del wizard ---
    var currentStep = 0;
    var answers = {}; // { qNum: points | raw scale (1-5) | array de niveles | texto }
    var contextAnswers = {}; // { contextId | leadName | leadEmail: valor }

    function isFirstQuestionOfSection(stepIndex) {
        for (var i = stepIndex - 1; i >= 0; i--) {
            if (STEPS[i].type === 'question') return STEPS[i].data.section !== STEPS[stepIndex].data.section;
        }
        return true;
    }

    function renderStep(index) {
        var step = STEPS[index];
        if (step.type === 'context') renderContextStep(step.data);
        else if (step.type === 'lead') renderLeadStep(step.data);
        else renderQuestionStep(index, step.data);
    }

    function stepIntroHtml(icon, sectionLabel, title, desc) {
        return '<div class="diag-step-intro">' +
            '<div class="diag-section-icon"><i class="fas ' + icon + '"></i></div>' +
            '<div>' +
                '<span class="diag-section-tag">' + sectionLabel + '</span>' +
                '<h2>' + title + '</h2>' +
                '<p>' + desc + '</p>' +
            '</div>' +
        '</div>';
    }

    function renderContextStep(cq) {
        var stepCard = document.getElementById('stepCard');
        var introHtml = stepIntroHtml(cq.icon, cq.sectionLabel, cq.title, cq.desc);
        var bodyHtml = '';

        if (cq.type === 'select') {
            var current = contextAnswers[cq.id] || '';
            bodyHtml = '<select class="diag-select" id="ctx_' + cq.id + '"><option value="" disabled' + (current ? '' : ' selected') + '>Selecciona una opción</option>';
            cq.options.forEach(function (opt) {
                bodyHtml += '<option value="' + opt + '"' + (current === opt ? ' selected' : '') + '>' + opt + '</option>';
            });
            bodyHtml += '</select>';
        } else {
            bodyHtml = '<div class="diag-choice-list">';
            cq.options.forEach(function (opt, i) {
                var checked = contextAnswers[cq.id] === opt ? ' checked' : '';
                bodyHtml +=
                    '<div class="diag-choice-option">' +
                        '<input type="radio" name="ctx_' + cq.id + '" id="ctx_' + cq.id + '_' + i + '" value="' + opt + '"' + checked + '>' +
                        '<label for="ctx_' + cq.id + '_' + i + '">' + opt + '</label>' +
                    '</div>';
            });
            bodyHtml += '</div>';
        }

        stepCard.innerHTML = introHtml + bodyHtml;

        if (cq.type === 'select') {
            document.getElementById('ctx_' + cq.id).addEventListener('change', function (e) {
                contextAnswers[cq.id] = e.target.value;
                updateNav();
            });
        } else {
            stepCard.querySelectorAll('input[type="radio"]').forEach(function (r) {
                r.addEventListener('change', function () {
                    contextAnswers[cq.id] = r.value;
                    updateNav();
                });
            });
        }

        updateProgress();
        updateNav();
    }

    function renderLeadStep(lead) {
        var stepCard = document.getElementById('stepCard');
        var introHtml = stepIntroHtml(lead.icon, lead.sectionLabel, lead.title, lead.desc);
        var name = contextAnswers.leadName || '';
        var email = contextAnswers.leadEmail || '';

        stepCard.innerHTML = introHtml +
            '<div class="diag-lead-fields">' +
                '<div class="diag-lead-field">' +
                    '<label for="leadName">Nombre</label>' +
                    '<input type="text" class="diag-text-input" id="leadName" placeholder="Tu nombre" value="' + name.replace(/"/g, '&quot;') + '">' +
                '</div>' +
                '<div class="diag-lead-field">' +
                    '<label for="leadEmail">Correo</label>' +
                    '<input type="email" class="diag-text-input" id="leadEmail" placeholder="tu@empresa.com" value="' + email.replace(/"/g, '&quot;') + '">' +
                '</div>' +
            '</div>';

        document.getElementById('leadName').addEventListener('input', function (e) {
            contextAnswers.leadName = e.target.value;
            updateNav();
        });
        document.getElementById('leadEmail').addEventListener('input', function (e) {
            contextAnswers.leadEmail = e.target.value;
            updateNav();
        });

        updateProgress();
        updateNav();
    }

    function questionDimsLabel(q) {
        return q.dims.map(function (d) { return DIMENSIONS[d].label; }).join(' · ');
    }

    function renderQuestionStep(stepIndex, q) {
        var section = SECTIONS[q.section];
        var stepCard = document.getElementById('stepCard');

        var introHtml;
        if (isFirstQuestionOfSection(stepIndex)) {
            introHtml = stepIntroHtml(section.icon, q.section, q.section, section.desc);
        } else {
            introHtml = '<div class="diag-step-chip"><i class="fas ' + section.icon + '"></i> ' + q.section + '</div>';
        }

        var dimsTag = q.dims && q.dims.length ? '<span class="diag-question-dims">Dimensión: ' + questionDimsLabel(q) + '</span><br>' : '';
        var bodyHtml = dimsTag + '<p class="diag-question-text diag-question-text-step">' + q.text + '</p>';

        if (q.type === 'text') {
            var val = answers[q.num] || '';
            bodyHtml += '<textarea class="diag-textarea" id="q_' + q.num + '" placeholder="Escribe tu respuesta aquí...">' + val.replace(/</g, '&lt;') + '</textarea>' +
                '<p class="diag-question-guide">' + q.guide + '</p>';
        } else if (q.type === 'scale5') {
            bodyHtml += '<div class="diag-options diag-options-5">';
            for (var s = 1; s <= 5; s++) {
                var checkedScale = answers[q.num] === s ? ' checked' : '';
                bodyHtml +=
                    '<div class="diag-option">' +
                        '<input type="radio" name="q' + q.num + '" id="q' + q.num + '_' + s + '" value="' + s + '"' + checkedScale + '>' +
                        '<label for="q' + q.num + '_' + s + '">' +
                            '<span class="diag-opt-num">' + s + '</span>' +
                            '<span class="diag-opt-label">' + q.scaleLabels[s - 1] + '</span>' +
                        '</label>' +
                    '</div>';
            }
            bodyHtml += '</div>';
        } else if (q.type === 'multi') {
            bodyHtml += '<div class="diag-choice-list">';
            q.options.forEach(function (opt, i) {
                var savedArr = answers[q.num] || [];
                var checkedMulti = savedArr.indexOf(i) !== -1 ? ' checked' : '';
                bodyHtml +=
                    '<div class="diag-choice-option">' +
                        '<input type="checkbox" id="q' + q.num + '_' + i + '" value="' + i + '"' + checkedMulti + '>' +
                        '<label for="q' + q.num + '_' + i + '">' + opt.label + '</label>' +
                    '</div>';
            });
            bodyHtml += '</div>';
        } else {
            // single
            bodyHtml += '<div class="diag-choice-list">';
            q.options.forEach(function (opt, i) {
                var checkedSingle = answers[q.num] === i ? ' checked' : '';
                bodyHtml +=
                    '<div class="diag-choice-option">' +
                        '<input type="radio" name="q' + q.num + '" id="q' + q.num + '_' + i + '" value="' + i + '"' + checkedSingle + '>' +
                        '<label for="q' + q.num + '_' + i + '">' + opt.label + '</label>' +
                    '</div>';
            });
            bodyHtml += '</div>';
        }

        stepCard.innerHTML = introHtml + bodyHtml;

        if (q.type === 'text') {
            document.getElementById('q_' + q.num).addEventListener('input', function (e) {
                answers[q.num] = e.target.value;
                updateNav();
            });
        } else if (q.type === 'multi') {
            var boxes = stepCard.querySelectorAll('input[type="checkbox"]');
            boxes.forEach(function (box) {
                box.addEventListener('change', function () {
                    var selected = [];
                    boxes.forEach(function (b) { if (b.checked) selected.push(parseInt(b.value, 10)); });
                    answers[q.num] = selected;
                    updateNav();
                });
            });
        } else {
            stepCard.querySelectorAll('input[type="radio"]').forEach(function (r) {
                r.addEventListener('change', function () {
                    answers[q.num] = q.type === 'scale5' ? parseInt(r.value, 10) : parseInt(r.value, 10);
                    updateNav();
                });
            });
        }

        updateProgress();
        updateNav();
    }

    function updateProgress() {
        var fill = document.getElementById('progressFill');
        var text = document.getElementById('progressText');
        var pct = ((currentStep + 1) / TOTAL_STEPS) * 100;
        fill.style.width = pct + '%';
        text.textContent = 'Pregunta ' + (currentStep + 1) + ' de ' + TOTAL_STEPS;
    }

    function isEmailValid(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isCurrentStepAnswered() {
        var step = STEPS[currentStep];

        if (step.type === 'context') {
            var cq = step.data;
            var val = contextAnswers[cq.id];
            return !!(val && val.length > 0);
        }

        if (step.type === 'lead') {
            var name = (contextAnswers.leadName || '').trim();
            var email = (contextAnswers.leadEmail || '').trim();
            return name.length > 0 && isEmailValid(email);
        }

        var q = step.data;
        if (q.type === 'text') {
            return !!(answers[q.num] && answers[q.num].trim().length > 0);
        }
        if (q.type === 'multi') {
            return !!(answers[q.num] && answers[q.num].length > 0);
        }
        return answers[q.num] !== undefined;
    }

    function updateNav() {
        var backBtn = document.getElementById('backBtn');
        var nextBtn = document.getElementById('nextBtn');

        backBtn.disabled = currentStep === 0;
        nextBtn.disabled = !isCurrentStepAnswered();

        if (currentStep === TOTAL_STEPS - 1) {
            nextBtn.innerHTML = 'Ver mi diagnóstico <i class="fas fa-chart-simple"></i>';
        } else {
            nextBtn.innerHTML = 'Siguiente <i class="fas fa-arrow-right"></i>';
        }
    }

    function goNext() {
        if (!isCurrentStepAnswered()) return;

        if (currentStep < TOTAL_STEPS - 1) {
            currentStep++;
            renderStep(currentStep);
            document.getElementById('quiz').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            finishQuiz();
        }
    }

    function goBack() {
        if (currentStep === 0) return;
        currentStep--;
        renderStep(currentStep);
        document.getElementById('quiz').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function multiLevel(selectedIndexes, options) {
        var max = 0;
        (selectedIndexes || []).forEach(function (i) {
            if (options[i] && options[i].level > max) max = options[i].level;
        });
        return max;
    }

    function computeScores() {
        var dimPoints = {};
        var dimMax = {};
        DIM_ORDER.forEach(function (k) { dimPoints[k] = 0; dimMax[k] = 0; });

        QUESTIONS.forEach(function (q) {
            if (!q.dims || q.dims.length === 0) return; // preguntas sin dimensión propia (ej. escala de apoyo)

            var pts = 0;
            if (q.type === 'text') {
                pts = scoreFreeText(answers[q.num]);
            } else if (q.type === 'multi') {
                pts = multiLevel(answers[q.num], q.options);
                if (q.num === 12 && pts === 4) {
                    var q13raw = answers[13];
                    if (q13raw && q13raw >= 4) pts = 5;
                }
            } else if (q.type === 'scale5') {
                var raw = answers[q.num];
                pts = raw ? SCALE5_POINTS[raw - 1] : 0;
            } else {
                var idx = answers[q.num];
                pts = (idx !== undefined && q.options[idx]) ? q.options[idx].points : 0;
            }

            q.dims.forEach(function (d) {
                dimPoints[d] += pts;
                dimMax[d] += 5;
            });
        });

        var dimScores = {};
        DIM_ORDER.forEach(function (k) {
            dimScores[k] = dimMax[k] > 0 ? (dimPoints[k] / dimMax[k]) * 100 : 0;
        });

        var total = 0;
        DIM_ORDER.forEach(function (k) { total += DIMENSIONS[k].weight * dimScores[k]; });
        total = total / 100;

        return { dimScores: dimScores, total: total };
    }

    function foundationMessage(key) {
        var messages = {
            estrategia: 'Define 2 o 3 objetivos concretos que la IA debería mover (ahorrar horas, reducir errores, vender más) antes de elegir cualquier herramienta.',
            datos: 'Centraliza y limpia la información que un sistema necesitaría para decidir: hoy probablemente repartida entre Excel, WhatsApp y correos.',
            casosDeUso: 'Elige un solo problema puntual para resolver primero, en vez de intentar automatizar todo el negocio a la vez.',
            procesos: 'Documenta el proceso que más te interesa automatizar: entradas, pasos y responsable, antes de conectarle un sistema.',
            talento: 'Da a tu equipo al menos un taller práctico de IA aplicado a su trabajo diario, no solo una charla general.',
            gobierno: 'Define, aunque sea informalmente, qué herramientas de IA están permitidas y quién las aprueba.',
            liderazgo: 'Nombra a una persona responsable de que la adopción de IA avance, aunque no sea su título formal.',
            tecnologia: 'Identifica si tus sistemas actuales tienen con qué conectarse (una API, una base de datos) antes de sumar IA encima.',
            adopcion: 'Empieza con un piloto pequeño y visible para que el equipo vea el beneficio antes de pedirle que cambie su rutina.',
            seguridad: 'Define reglas claras sobre quién puede ver y compartir información sensible antes de automatizar procesos que la usan.',
            medicion: 'Define desde ahora cómo vas a medir el impacto de cualquier piloto: horas, costos o ventas, no solo percepción.',
            escalabilidad: 'Antes de sumar más pilotos, lleva el que ya tienes a producción y aprende de él.'
        };
        return messages[key] || '';
    }

    var KAIROS_WHATSAPP = '593998730180';
    var currentWaUrl = '';

    function sendWhatsAppThenPromptBooking() {
        if (!currentWaUrl) return;
        window.open(currentWaUrl, '_blank', 'noopener');

        var waBtn = document.getElementById('waCalBtn');
        if (waBtn) {
            waBtn.disabled = true;
            waBtn.innerHTML = '<i class="fas fa-check"></i> Diagnóstico enviado';
        }

        var step2 = document.getElementById('ctaStep2');
        if (step2) {
            step2.hidden = false;
            step2.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function buildWhatsAppMessage(scores) {
        var totalLevel = getLevel(scores.total);
        var lines = [];

        lines.push('*Nuevo diagnóstico IA — KAIROS*');
        lines.push('');
        lines.push('👤 ' + (contextAnswers.leadName || 'Sin nombre') + (contextAnswers.leadEmail ? ' (' + contextAnswers.leadEmail + ')' : ''));
        lines.push('🏢 ' + (contextAnswers.industria || 'Industria no especificada') + ' · ' + (contextAnswers.tamano || '¿?') + ' personas · ' + (contextAnswers.relacion || 'Rol no especificado'));
        lines.push('');
        lines.push('📊 *Puntaje global: ' + Math.round(scores.total) + '/100 — ' + totalLevel.label + '*');
        lines.push(totalLevel.desc);
        lines.push('');

        lines.push('*Puntaje por dimensión:*');
        DIM_ORDER.forEach(function (key) {
            var s = scores.dimScores[key];
            lines.push('• ' + DIMENSIONS[key].label + ': ' + Math.round(s) + '/100 (' + getLevel(s).label + ')');
        });
        lines.push('');

        var problema = (answers[4] || '').trim();
        if (problema) {
            lines.push('*Problema principal a resolver:*');
            lines.push(problema);
            lines.push('');
        }

        var proceso = (answers[11] || '').trim();
        if (proceso) {
            lines.push('*Proceso a mejorar:*');
            lines.push(proceso);
            lines.push('');
        }

        var weakDims = DIM_ORDER
            .filter(function (key) { return scores.dimScores[key] < 40; })
            .sort(function (a, b) { return scores.dimScores[a] - scores.dimScores[b]; });

        if (weakDims.length > 0) {
            lines.push('*Fundamentos por resolver primero:*');
            weakDims.forEach(function (key) {
                lines.push('⚠️ ' + DIMENSIONS[key].label + ' (' + Math.round(scores.dimScores[key]) + '/100): ' + foundationMessage(key));
            });
            lines.push('');
        }

        var ranked = USE_CASE_CATALOG
            .map(function (uc) { return { uc: uc, score: scores.dimScores[uc.dim] }; })
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, 6);

        lines.push('*Casos de uso priorizados:*');
        ranked.forEach(function (item, i) {
            var tag = item.score >= 65 ? 'Prioridad alta' : (item.score >= 40 ? 'Prioridad media' : 'Prioridad baja');
            lines.push((i + 1) + '. ' + item.uc.title + ' — ' + tag);
            lines.push('   ' + item.uc.desc);
        });

        return lines.join('\n');
    }

    function prepareWhatsAppLink(scores) {
        var text = buildWhatsAppMessage(scores);
        currentWaUrl = 'https://wa.me/' + KAIROS_WHATSAPP + '?text=' + encodeURIComponent(text);
    }

    function renderResultsContext() {
        var el = document.getElementById('resultsContext');
        var parts = [];
        if (contextAnswers.leadName) parts.push(contextAnswers.leadName.trim());
        if (contextAnswers.industria) parts.push(contextAnswers.industria);
        if (contextAnswers.tamano) parts.push(contextAnswers.tamano + ' personas');
        el.textContent = parts.join(' · ');
    }

    function renderResults(scores) {
        renderResultsContext();

        var dimScores = scores.dimScores;
        var total = scores.total;
        var totalLevel = getLevel(total);

        var ring = document.getElementById('globalRing');
        ring.style.background =
            'conic-gradient(var(--color-cian) 0deg, var(--color-morado) ' + (total * 3.6) + 'deg, rgba(255,255,255,0.08) ' + (total * 3.6) + 'deg)';
        document.getElementById('globalNumber').textContent = Math.round(total);
        document.getElementById('globalLevel').textContent = totalLevel.label;
        document.getElementById('globalDesc').textContent = totalLevel.desc;

        var dimsGrid = document.getElementById('dimsGrid');
        dimsGrid.innerHTML = '';
        DIM_ORDER.forEach(function (key) {
            var dim = DIMENSIONS[key];
            var score = dimScores[key];
            var level = getLevel(score);
            var card = document.createElement('div');
            card.className = 'diag-dim-card';
            card.innerHTML =
                '<div class="diag-dim-card-head">' +
                    '<span><i class="fas ' + dim.icon + '"></i> ' + dim.label + '</span>' +
                    '<span class="diag-dim-score">' + Math.round(score) + '/100</span>' +
                '</div>' +
                '<div class="diag-dim-bar-track"><div class="diag-dim-bar-fill" style="width:' + score + '%"></div></div>' +
                '<span class="diag-dim-level">' + level.label + '</span>';
            dimsGrid.appendChild(card);
        });

        var weakDims = DIM_ORDER.filter(function (key) { return dimScores[key] < 40; });
        var foundationsBlock = document.getElementById('foundationsBlock');
        var foundationsList = document.getElementById('foundationsList');
        foundationsList.innerHTML = '';

        if (weakDims.length > 0) {
            foundationsBlock.hidden = false;
            weakDims
                .sort(function (a, b) { return dimScores[a] - dimScores[b]; })
                .forEach(function (key) {
                    var dim = DIMENSIONS[key];
                    var li = document.createElement('li');
                    li.innerHTML = '<strong>' + dim.label + ' (' + Math.round(dimScores[key]) + '/100):</strong> ' +
                        foundationMessage(key);
                    foundationsList.appendChild(li);
                });
        } else {
            foundationsBlock.hidden = true;
        }

        var usecasesList = document.getElementById('usecasesList');
        usecasesList.innerHTML = '';

        var ranked = USE_CASE_CATALOG
            .map(function (uc) { return { uc: uc, score: dimScores[uc.dim] }; })
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, 6);

        ranked.forEach(function (item) {
            var tagClass = item.score >= 65 ? 'alta' : (item.score >= 40 ? 'media' : 'baja');
            var tagLabel = item.score >= 65 ? 'Prioridad alta' : (item.score >= 40 ? 'Prioridad media' : 'Prioridad baja');
            var li = document.createElement('li');
            li.innerHTML =
                '<strong>' + item.uc.title + '<span class="diag-usecase-tag ' + tagClass + '">' + tagLabel + '</span></strong>' +
                item.uc.desc;
            usecasesList.appendChild(li);
        });
    }

    function finishQuiz() {
        var scores = computeScores();
        renderResults(scores);
        prepareWhatsAppLink(scores);

        document.getElementById('diagForm').hidden = true;
        document.querySelector('.diag-progress-wrap').hidden = true;
        var results = document.getElementById('results');
        results.hidden = false;
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function restart() {
        currentStep = 0;
        answers = {};
        contextAnswers = {};
        document.getElementById('diagForm').hidden = false;
        document.querySelector('.diag-progress-wrap').hidden = false;
        document.getElementById('results').hidden = true;

        var waBtn = document.getElementById('waCalBtn');
        if (waBtn) {
            waBtn.disabled = false;
            waBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Enviar mi diagnóstico por WhatsApp';
        }
        var step2 = document.getElementById('ctaStep2');
        if (step2) step2.hidden = true;

        renderStep(0);
        document.getElementById('quiz').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function init() {
        renderStep(0);

        document.getElementById('nextBtn').addEventListener('click', goNext);
        document.getElementById('backBtn').addEventListener('click', goBack);
        document.getElementById('restartBtn').addEventListener('click', restart);
        document.getElementById('waCalBtn').addEventListener('click', sendWhatsAppThenPromptBooking);

        document.getElementById('diagForm').addEventListener('submit', function (e) { e.preventDefault(); });
        document.getElementById('diagForm').addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                goNext();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
