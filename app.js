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
});