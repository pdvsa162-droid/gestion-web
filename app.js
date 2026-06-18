document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // VARIABLES GLOBALES
    // ==========================================================================
    let directorioHandle = null;
    let listaDeCurriculums = [];

    const folderOverlay = document.getElementById('folder-overlay');
    const modalBox = document.getElementById('modal-box');
    const btnConcederAcceso = document.getElementById('btnConcederAcceso');
    const btnBuscar = document.getElementById('btnBuscar');
    const tablaContenedor = document.getElementById('tablaContenedor');
    const puestoBusqueda = document.getElementById('puestoBusqueda');
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // ==========================================================================
    // DICCIONARIO SEMÁNTICO
    // ==========================================================================
    const diccionarioSemantico = {
        "electricista": ["electricidad", "electrico", "electrica", "cable", "cableado", "tableros", "tension", "circuitos", "instalaciones", "mantenimiento", "trifasico", "motor", "subestacion"],
        "programador": ["desarrollador", "software", "sistemas", "it", "codigo", "web", "react", "javascript", "python", "java", "backend", "frontend", "git", "sql", "analista"],
        "ingeniero": ["petroleo", "quimico", "procesos", "refineria", "fluidos", "perforacion", "yacimientos", "mantenimiento", "seguridad", "industrial", "operaciones"]
    };

    // ==========================================================================
    // ACCESO A FILE SYSTEM
    // ==========================================================================
    if (btnConcederAcceso) {
        btnConcederAcceso.addEventListener('click', async () => {
            try {

                directorioHandle = await window.showDirectoryPicker({
                    mode: 'readwrite'
                });

                await cargarCSVDesdeCarpeta();

                // animación visual
                if (modalBox) modalBox.classList.add('modal-animacion-gota');

                if (folderOverlay) {
                    folderOverlay.style.backgroundColor = 'rgba(15, 23, 42, 0)';
                    folderOverlay.style.backdropFilter = 'blur(0px)';
                }

                setTimeout(() => {
                    document.body.classList.add('sistema-visible');
                }, 400);

                setTimeout(() => {
                    if (folderOverlay) folderOverlay.remove();
                }, 1000);

            } catch (error) {
                console.error(error);
                alert("Operación cancelada o inválida. Debes seleccionar un directorio.");
            }
        });
    }

    // ==========================================================================
    // LECTURA CSV
    // ==========================================================================
    async function cargarCSVDesdeCarpeta() {
        try {
            const archivoHandle = await directorioHandle.getFileHandle('curriculums.csv');
            const archivo = await archivoHandle.getFile();
            const texto = await archivo.text();

            const lineas = texto.split(/\r?\n/);

            listaDeCurriculums = [];

            for (let i = 1; i < lineas.length; i++) {
                const fila = lineas[i].trim();
                if (!fila) continue;

                const columnas = fila.split(',');

                if (columnas.length >= 3) {
                    listaDeCurriculums.push({
                        nombre: columnas[0].trim(),
                        contacto: columnas[1].trim(),
                        perfil: columnas.slice(2).join(',').trim(),
                        puntuacion: 0
                    });
                }
            }

            if (listaDeCurriculums.length > 0 && btnBuscar) {
                btnBuscar.disabled = false;
                puestoBusqueda.placeholder = "🔍 Escriba el perfil a buscar...";
            }

        } catch (error) {
            console.warn("CSV no encontrado o error de lectura:", error);

            if (btnBuscar) {
                btnBuscar.disabled = true;
                puestoBusqueda.placeholder = "⚠️ No se encontró 'curriculums.csv'";
            }
        }
    }

    // ==========================================================================
    // NORMALIZACIÓN TEXTO
    // ==========================================================================
    function normalizarTexto(texto) {
        return (texto || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, ' ');
    }

    // ==========================================================================
    // BUSCADOR SEMÁNTICO
    // ==========================================================================
    if (btnBuscar) {
        btnBuscar.addEventListener('click', () => {

            const entrada = puestoBusqueda.value.trim();
            if (!entrada) return;

            const palabrasBase = normalizarTexto(entrada)
                .split(' ')
                .filter(p => p.length > 2);

            let palabrasFinales = [...palabrasBase];

            palabrasBase.forEach(p => {
                if (diccionarioSemantico[p]) {
                    palabrasFinales.push(...diccionarioSemantico[p]);
                }
            });

            palabrasFinales = [...new Set(palabrasFinales)];

            listaDeCurriculums.forEach(cv => {

                const perfil = normalizarTexto(cv.perfil);

                let score = 0;

                palabrasFinales.forEach(p => {
                    const regex = new RegExp(p, 'g');
                    const matches = (perfil.match(regex) || []).length;
                    score += matches;
                });

                cv.puntuacion = score;
            });

            listaDeCurriculums.sort((a, b) => b.puntuacion - a.puntuacion);

            mostrarResultados();
        });

        puestoBusqueda.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !btnBuscar.disabled) {
                btnBuscar.click();
            }
        });
    }

    // ==========================================================================
    // RENDER TABLA
    // ==========================================================================
    function mostrarResultados() {

        if (!tablaContenedor) return;

        if (listaDeCurriculums.length === 0) {
            tablaContenedor.innerHTML = "<p>No hay datos cargados.</p>";
            return;
        }

        let html = `
        <table>
            <thead>
                <tr>
                    <th>Rango</th>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Coincidencias</th>
                    <th>Perfil</th>
                </tr>
            </thead>
            <tbody>
        `;

        listaDeCurriculums.forEach((cv, i) => {

            let estado = "baja";
            let textoScore = `${cv.puntuacion}`;

            if (cv.puntuacion > 4) estado = "alta";
            else if (cv.puntuacion > 0) estado = "media";
            else textoScore = "0";

            html += `
                <tr>
                    <td>#${i + 1}</td>
                    <td>${cv.nombre}</td>
                    <td>${cv.contacto}</td>
                    <td class="${estado}">${textoScore}</td>
                    <td>${cv.perfil}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;

        tablaContenedor.innerHTML = html;
    }

    // ==========================================================================
    // TABS
    // ==========================================================================
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            link.classList.add('active');

            const target = document.querySelector(link.getAttribute('href'));
            if (target) target.classList.add('active');
        });
    });
    
     // Selectores de los elementos interactivos
    const btnVistaBuscador = document.getElementById('btnVistaBuscador');
    const btnVistaIngresar = document.getElementById('btnVistaIngresar');
    const submoduloBuscar = document.getElementById('submodulo-buscar-contenedor');
    const submoduloIngresar = document.getElementById('submodulo-ingresar-contenedor');
    
    const toggleAvanzado = document.getElementById('toggleAvanzado');
    const panelAvanzado = document.getElementById('panel-avanzado');

    // CONTROL SEGURO DE BOTONES DE MODO (Sin sobreescribir estilos crudos)
    if (btnVistaBuscador && btnVistaIngresar) {
        btnVistaBuscador.addEventListener('click', () => {
            submoduloIngresar.style.display = 'none';
            submoduloBuscar.style.display = 'block';
            
            btnVistaIngresar.classList.remove('active');
            btnVistaBuscador.classList.add('active');
        });

        btnVistaIngresar.addEventListener('click', () => {
            submoduloBuscar.style.display = 'none';
            submoduloIngresar.style.display = 'block';
            
            btnVistaBuscador.classList.remove('active');
            btnVistaIngresar.classList.add('active');
        });
    }

    // DESPLIEGUE ELÁSTICO ADAPTADO AL PANEL AVANZADO INTEGRADO
    if (toggleAvanzado && panelAvanzado) {
        toggleAvanzado.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Si está cerrado, abrimos el panel y ajustamos la altura al espacio de las 2 filas
            if (!panelAvanzado.classList.contains('open')) {
                panelAvanzado.classList.add('open');
                panelAvanzado.style.maxHeight = '250px'; 
                toggleAvanzado.textContent = '⚙️ Ocultar Opciones Avanzadas';
            } else {
                panelAvanzado.classList.remove('open');
                panelAvanzado.style.maxHeight = '0px';
                toggleAvanzado.textContent = '⚙️ Mostrar Opciones Avanzadas';
            }
        });
    }
    // =====================================================
    // WIZARD DE REGISTRO DE POSTULANTES
    // =====================================================
    
    const paso1 = document.getElementById('paso1');
    const paso2 = document.getElementById('paso2');

    const btnSiguiente = document.getElementById('btnSiguiente');
    const btnVolver = document.getElementById('btnVolver');

    const wizardBar = document.getElementById('wizardBar');
    const wizardTexto = document.getElementById('wizardPasoTexto');

    // =====================================================
    // FECHA DE NACIMIENTO -> EDAD
    // =====================================================

    const fechaNacimiento = document.getElementById('ins_fecha_nac');
    const edadInput = document.getElementById('ins_edad');

    if (fechaNacimiento) {

        fechaNacimiento.addEventListener('change', () => {

            const fecha = new Date(fechaNacimiento.value);

            if (isNaN(fecha)) return;

            const hoy = new Date();

            let edad = hoy.getFullYear() - fecha.getFullYear();

            const mes = hoy.getMonth() - fecha.getMonth();

            if (
                mes < 0 ||
                (mes === 0 && hoy.getDate() < fecha.getDate())
            ) {
                edad--;
            }

            edadInput.value = edad;
        });
    }

    // =====================================================
    // CAMBIO DE PASOS
    // =====================================================

    if (btnSiguiente) {

        btnSiguiente.addEventListener('click', () => {

            paso1.classList.remove('active');
            paso2.classList.add('active');

            wizardBar.style.width = '100%';

            wizardTexto.textContent =
                'Paso 2 de 2 - Formación Académica y Experiencia';
        });
    }

    if (btnVolver) {

        btnVolver.addEventListener('click', () => {

            paso2.classList.remove('active');
            paso1.classList.add('active');

            wizardBar.style.width = '50%';

            wizardTexto.textContent =
                'Paso 1 de 2 - Datos Personales';
        });
    }

    // =====================================================
    // ESTADO ACADÉMICO DINÁMICO
    // =====================================================

    const nivelAcademico =
        document.getElementById('ins_nivel');

    const estadoContainer =
        document.getElementById('estadoAcademicoContainer');

    const opcionesAcademicas = {

        "Primaria": [
            "Incompleta",
            "En curso",
            "Finalizada"
        ],

        "Bachiller": [
            "Incompleto",
            "En curso",
            "Graduado"
        ],

        "TSU": [
            "En curso",
            "Graduado"
        ],

        "Universitario": [
            "En curso",
            "Graduado",
            "Postgrado"
        ]
    };

    if (nivelAcademico) {

        nivelAcademico.addEventListener('change', () => {

            estadoContainer.innerHTML = '';

            const opciones =
                opcionesAcademicas[nivelAcademico.value] || [];

            opciones.forEach(opcion => {

                const label =
                    document.createElement('label');

                label.className =
                    'estado-academico-opcion';

                label.innerHTML = `
                    <input
                        type="radio"
                        name="estadoAcademico"
                        value="${opcion}">
                    ${opcion}
                `;

                estadoContainer.appendChild(label);
            });

        });

    }

    // =====================================================
    // UNIVERSIDADES
    // =====================================================

    const universidades = [

        "Universidad Central de Venezuela (UCV)",
        "Universidad de Oriente (UDO)",
        "Universidad de Carabobo (UC)",
        "Universidad Simón Bolívar (USB)",
        "Universidad Nacional Experimental de Guayana (UNEG)",
        "Universidad Nacional Experimental Politécnica Antonio José de Sucre (UNEXPO)",
        "Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional Bolivariana (UNEFA)",
        "Universidad Centroccidental Lisandro Alvarado (UCLA)",
        "Universidad Nacional Abierta (UNA)",
        "Universidad Nacional Experimental Francisco de Miranda (UNEFM)",
        "Universidad Nacional Experimental Marítima del Caribe (UMC)",
        "Universidad Nacional Experimental de los Llanos Occidentales Ezequiel Zamora (UNELLEZ)",
        "Universidad Nacional Experimental de la Gran Caracas (UNEXCA)",
        "Universidad Politécnica Territorial de los Altos Mirandinos Cecilio Acosta (UPTAMCA)",
        "Universidad Tecnológica de Panamá (UTP)",
        "Universidad de Panamá (UP)",
        "Universidad Autónoma de Chiriquí (UNACHI)",
        "Universidad Autónoma de Santo Domingo (UASD)",
        "Universidad de Cuenca (UCUENCA)",
        "Universidad Técnica de Ambato (UTA)",
        "Universidad Técnica de Machala (UTMACH)",
        "Universidad Técnica Estatal de Quevedo (UTEQ)",
        "Universidad Tecnica del Norte (UTN)",
        "Universidad de Guayaquil (UG)",
        "Universidad de El Salvador (UES)",
        "Universidad de Los Andes (ULA)"
    ];

    const universidadInput =
        document.getElementById('ins_universidad');

    const sugerencias =
        document.getElementById('universidadSuggestions');

    if (universidadInput) {

        universidadInput.addEventListener('input', () => {

            const texto =
                universidadInput.value.toLowerCase().trim();

            sugerencias.innerHTML = '';

            if (texto.length < 2) {

                sugerencias.style.display = 'none';
                return;
            }

            const resultados = universidades.filter(u =>
                u.toLowerCase().includes(texto)
            );

            if (!resultados.length) {

                sugerencias.style.display = 'none';
                return;
            }

            sugerencias.style.display = 'block';

            resultados.slice(0, 8).forEach(universidad => {

                const item =
                    document.createElement('div');

                item.className =
                    'autocomplete-item';

                item.textContent =
                    universidad;

                item.addEventListener('click', () => {

                    universidadInput.value =
                        universidad;

                    sugerencias.style.display =
                        'none';
                });

                sugerencias.appendChild(item);
            });

        });

        document.addEventListener('click', (e) => {

            if (
                e.target !== universidadInput
            ) {
                sugerencias.style.display =
                    'none';
            }
        });
    }

    // =====================================================
    // LIMPIAR FORMULARIO
    // =====================================================

    const form =
        document.getElementById('formNuevoCandidato');

    const btnLimpiarForm =
        document.getElementById('btnLimpiarForm');

    const btnLimpiarPaso1 =
        document.getElementById('btnLimpiarPaso1');

    function limpiarFormulario() {

        form.reset();

        edadInput.value = '';

        estadoContainer.innerHTML = '';

        sugerencias.innerHTML = '';
        sugerencias.style.display = 'none';

        paso2.classList.remove('active');
        paso1.classList.add('active');

        wizardBar.style.width = '50%';

        wizardTexto.textContent =
            'Paso 1 de 2 - Datos Personales';
    }

    if (btnLimpiarForm) {
        btnLimpiarForm.addEventListener(
            'click',
            limpiarFormulario
        );
    }

    if (btnLimpiarPaso1) {
        btnLimpiarPaso1.addEventListener(
            'click',
            limpiarFormulario
        );
    }

});
