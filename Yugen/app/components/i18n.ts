export type Language = "pt" | "en" | "es";

export const languageOptions: Array<{ value: Language; short: string; label: string; htmlLang: string }> = [
  { value: "pt", short: "PT", label: "Português", htmlLang: "pt-BR" },
  { value: "en", short: "EN", label: "English", htmlLang: "en" },
  { value: "es", short: "ES", label: "Español", htmlLang: "es" },
];

type Dictionary = Record<string, string>;

const en: Dictionary = {
  "Início": "Home", "Catálogo": "Catalog", "Notícias": "News", "Coleções": "Collections", "Discussões": "Discussions", "Início do Yugen": "Yugen home", "Navegação principal": "Main navigation",
  "Entrar": "Log in", "Criar conta": "Create account", "Ver perfil": "View profile", "Editar perfil": "Edit profile", "Sair": "Log out",
  "Voltar": "Back", "Pesquisar anime": "Search anime", "Pesquise um anime pelo título…": "Search anime by title…", "Limpar pesquisa": "Clear search",
  "Sugestões de anime": "Anime suggestions", "Pressione Enter para pesquisar tudo": "Press Enter to search all", "Pesquisando na API de animes…": "Searching the anime API…",
  "Não foi possível carregar as sugestões.": "Could not load suggestions.", "Abrir pesquisa de anime": "Open anime search", "Abrir ou fechar navegação": "Open or close navigation",
  "Mudar para o modo claro": "Switch to light mode", "Mudar para o modo escuro": "Switch to dark mode", "Abrir menu do perfil": "Open profile menu",
  "Atualizando pela Jikan": "Updating from Jikan", "API de animes indisponível": "Anime API unavailable", "Destaque ao vivo · Jikan / MyAnimeList": "Live spotlight · Jikan / MyAnimeList",
  "Carregando": "Loading", "anime…": "anime…", "Catálogo indisponível": "Catalog unavailable", "Buscando os dados mais recentes dos animes…": "Fetching the latest anime data…",
  "Saiba mais": "Learn more", "Tentar novamente": "Try again", "Carregando…": "Loading…", "Na sua lista": "In your list", "Quero assistir": "To watch",
  "nota da comunidade": "community score", "episódios": "episodes", "classificação indicativa": "age rating", "ROLE PARA DESCOBRIR": "SCROLL TO DISCOVER",
  "Selecionado pelo gosto, não pelo ruído": "Chosen by taste, not noise", "Histórias que valem": "Stories worth", "uma noite acordado.": "staying up for.",
  "O Yugen reúne descobertas, contexto e conversas da comunidade em um espaço tranquilo da internet.": "Yugen brings discoveries, context, and community conversations together in a quiet corner of the internet.",
  "Catálogo ao vivo · Jikan / MyAnimeList": "Live catalog · Jikan / MyAnimeList", "Especial para você": "Special for you", "Criadas pela comunidade": "Made by the community",
  "Coleções em destaque": "Featured collections", "Explorar todas": "Explore all", "O que a comunidade não para de comentar": "What the community cannot stop discussing",
  "Em alta agora": "Trending now", "O cânone compartilhado": "The shared canon", "Mais populares": "Most popular", "Ver catálogo": "View catalog", "Mostrar mais": "Show more", "Mostrar menos": "Show less",
  "Seu próximo favorito está esperando": "Your next favorite is waiting", "Guarde cada história": "Keep every story", "por perto.": "close.",
  "Acompanhe o que assiste, crie coleções e encontre pessoas que enxergam as mesmas coisas que você.": "Track what you watch, build collections, and find people who notice the same things you do.",
  "Criar sua biblioteca": "Create your library", "Carregando dados dos animes": "Loading anime data", "Não foi possível acessar o catálogo.": "Could not access the catalog.",
  "Dados ao vivo da Jikan / MyAnimeList": "Live data from Jikan / MyAnimeList", "Encontre sua próxima": "Find your next", "obsessão.": "obsession.",
  "Sinopses, trailers, personagens e detalhes de produção atualizados pela base de animes.": "Synopses, trailers, characters, and production details updated from the anime database.",
  "Resultados para": "Results for", "Mostrando as correspondências mais próximas para": "Showing the closest matches for", "Refine o termo no campo de pesquisa acima se necessário.": "Refine the term in the search field above if needed.",
  "Atualizando catálogo…": "Updating catalog…", "Mostrando": "Showing", "de": "of", "Ordenar por": "Sort by", "Relevância": "Relevance", "Popularidade": "Popularity",
  "Nota": "Rating", "Mais recentes": "Newest", "Filtros": "Filters", "Ano": "Year", "Ano inicial": "Start year", "Ano final": "End year", "De": "From", "Até": "To",
  "Temporada": "Season", "Todas": "All", "Gêneros": "Genres", "Todos": "All", "Estúdio": "Studio", "Todos os estúdios": "All studios", "Formato": "Format",
  "Status de exibição": "Airing status", "Todos os status": "All statuses", "Limpar todos os filtros": "Clear all filters", "Nenhum anime encontrado.": "No anime found.",
  "Tente ampliar ou limpar os filtros.": "Try broadening or clearing the filters.", "A definir": "TBA", "Série de TV": "TV series", "Filme": "Movie", "Especial": "Special", "Clipe musical": "Music video",
  "Inverno": "Winter", "Primavera": "Spring", "Verão": "Summer", "Outono": "Fall", "Em exibição": "Airing", "Exibição finalizada": "Finished airing", "Ainda não exibido": "Not yet aired", "Em breve": "Upcoming",
  "Ação": "Action", "Aventura": "Adventure", "Premiado": "Award winning", "Comédia": "Comedy", "Fantasia": "Fantasy", "Terror": "Horror", "Mistério": "Mystery", "Ficção científica": "Sci-Fi",
  "Cotidiano": "Slice of life", "Esportes": "Sports", "Sobrenatural": "Supernatural", "Gastronomia": "Gourmet", "Vanguarda": "Avant garde",
  "Somente Jikan / MyAnimeList": "Jikan / MyAnimeList only", "Anime não encontrado na API.": "Anime not found in the API.", "Esta página antiga foi removida porque o Yugen agora exibe apenas animes retornados pela Jikan.": "This old page was removed because Yugen now shows only anime returned by Jikan.",
  "Abrir catálogo da API": "Open API catalog", "Carregando dados do anime": "Loading anime data", "Dados do anime indisponíveis.": "Anime data unavailable.", "Voltar ao catálogo": "Back to catalog",
  "Assistir ao trailer": "Watch trailer", "avaliações": "ratings", "Aguardando avaliações": "Waiting for ratings", "Assistindo": "Watching", "Assistido": "Watched", "Adicionar à coleção": "Add to collection", "Abertura": "Opening", "Encerramento": "Ending",
  "Visão geral": "Overview", "Relações": "Relations", "Personagens": "Characters", "Equipe": "Staff", "Músicas-tema": "Theme songs", "Avaliações": "Reviews",
  "Detalhes": "Details", "Episódios": "Episodes", "Duração": "Duration", "Exibição": "Aired", "Status": "Status", "Origem": "Source", "Classificação": "Rating",
  "Desconhecido": "Unknown", "Não informada": "Not provided", "Não informado": "Not provided", "Não classificado": "Not rated", "Mangá": "Manga", "Jogo": "Game",
  "Sinopse": "Synopsis", "Sobre": "About", "Traduzindo sinopse…": "Translating synopsis…", "Não foi possível traduzir a sinopse. Exibindo o texto original.": "Could not translate the synopsis. Showing the original text.",
  "Dados da base": "Database data", "nota no MyAnimeList": "MyAnimeList score", "posição de popularidade": "popularity rank", "Obras conectadas": "Connected works",
  "Continuação": "Sequel", "Prequela": "Prequel", "História paralela": "Side story", "Alternativa": "Alternative", "Adaptação": "Adaptation", "Resumo": "Summary",
  "Elenco principal e personagens coadjuvantes": "Main and supporting cast", "Principal": "Main", "Coadjuvante": "Supporting", "Dublador não informado": "Voice actor not provided", "voz em japonês": "Japanese voice",
  "As pessoas por trás da produção": "The people behind the production", "Equipe de produção": "Production staff", "Direção": "Director", "Composição da série": "Series composition", "Roteiro": "Script",
  "Design de personagens": "Character design", "Música": "Music", "Criador original": "Original creator", "Direção de som": "Sound director", "Aberturas e encerramentos": "Openings and endings",
  "TEMAS DE ABERTURA": "OPENING THEMES", "TEMAS DE ENCERRAMENTO": "ENDING THEMES", "Análises aprofundadas": "In-depth reviews", "Avaliações da comunidade": "Community reviews",
  "Tópicos de episódios, teorias e recomendações": "Episode threads, theories, and recommendations", "Converse sobre detalhes, crie teorias e responda à comunidade sem sair da página do anime.": "Discuss details, build theories, and reply to the community without leaving the anime page.",
  "Mais recentes primeiro⌄": "Newest first⌄", "Geral": "General", "Teorias": "Theories", "Recomendações": "Recommendations", "Compartilhe uma teoria, observação ou pergunta…": "Share a theory, observation, or question…",
  "Seja gentil. Marque conteúdos com spoilers.": "Be kind. Mark spoilers.", "Marcar como spoiler": "Mark as spoiler", "Publicar comentário": "Post comment", "Responder": "Reply", "Denunciar": "Report",
  "Comunidade": "Community", "Para você": "For you", "Explorar": "Explore", "Notificações": "Notifications", "Salvos": "Bookmarks", "Perfil": "Profile", "Nova publicação": "New post",
  "Comunidade Yugen": "Yugen community", "Configurações das discussões": "Discussion settings", "Atualizar feed": "Refresh feed", "Visualização confortável": "Comfortable view", "Visualização compacta": "Compact view", "Regras da comunidade": "Community rules",
  "Seguindo": "Following", "No que você está pensando?": "What are you thinking about?", "Criar uma publicação": "Create a post", "Adicionar imagem": "Add image", "Adicionar enquete": "Add poll", "Marcar spoiler": "Mark spoiler", "Anexar anime": "Attach anime", "Publicar": "Post",
  "Encontre sua próxima conversa": "Find your next conversation", "Explore a comunidade.": "Explore the community.", "Pesquise teorias, tópicos de episódios, análises e recomendações em todo o Yugen.": "Search theories, episode threads, reviews, and recommendations across Yugen.",
  "Pesquisar pessoas, animes ou tópicos": "Search people, anime, or topics", "Tudo": "All", "Teoria": "Theory", "Episódio": "Episode", "Análise": "Analysis", "Em alta na Jikan": "Trending from Jikan",
  "Final de temporada": "Season finale", "Tópicos de episódios": "Episode threads", "Publicações da comunidade": "Community posts", "Escolhas da comunidade": "Community picks", "O que assistir agora": "What to watch next",
  "Nenhuma discussão encontrada": "No discussions found", "Tente outra busca ou categoria.": "Try another search or category.", "Atividade ao seu redor": "Activity around you", "Continue na conversa.": "Stay in the conversation.",
  "Marcar tudo como lido": "Mark all as read", "Tudo em dia": "All caught up", "Guardado para depois": "Saved for later", "Suas publicações salvas.": "Your bookmarks.", "Nada salvo ainda": "No bookmarks yet",
  "Ver discussões": "Browse discussions", "Pesquisar discussões": "Search discussions", "O que está acontecendo": "What’s happening", "Em alta no Yugen": "Trending in Yugen", "Ao vivo da Jikan": "Live from Jikan", "Quem seguir": "Who to follow", "Seguir": "Follow",
  "Privacidade": "Privacy", "Termos": "Terms", "Criadas por pessoas, alimentadas pela Jikan": "Curated by people, powered by Jikan", "Coleções com": "Collections with", "um ponto de vista.": "a point of view.", "Criar nova": "Create new",
  "Coleção": "Collection", "títulos": "titles", "por": "by", "Abrir coleção": "Open collection", "Destaque da API · Jikan / MyAnimeList": "API spotlight · Jikan / MyAnimeList", "Abrir anime": "Open anime",
  "Da redação": "From the editorial desk", "Últimas histórias": "Latest stories", "Produção": "Craft", "Ensaios": "Essays", "Membro desde 2024": "Member since 2024", "Seguidores": "Followers",
  "Assistidos": "Watched", "Atualizados recentemente": "Recently updated", "Título": "Title", "Seu espaço": "Personal space", "Configurações": "Account", "da conta.": "settings.",
  "Conta": "Account", "Importações": "Imports", "Zona de perigo": "Danger zone", "Identidade pública": "Public identity", "Alterar avatar": "Change avatar", "Alterar banner": "Change banner", "Nome de usuário": "Username", "Biografia": "Bio",
  "Dados privados": "Private details", "Senha atual": "Current password", "Nova senha": "New password", "Pelo menos 12 caracteres": "At least 12 characters", "Salvar alterações": "Save changes", "Alterações salvas": "Changes saved",
  "Traga seu histórico": "Bring your history", "Importar do MyAnimeList": "Import from MyAnimeList", "Excluir conta": "Delete account", "Cancelar": "Cancel", "Fechar": "Close",
  "Entre no Yugen": "Join Yugen", "Boas-vindas de volta": "Welcome back", "Redefinir senha": "Reset password", "Sua biblioteca espera por você": "Your library awaits", "Continuar com ChatGPT": "Continue with ChatGPT", "Continuar com Google": "Continue with Google", "Continuar com Apple": "Continue with Apple",
  "ou continue com email": "or continue with email", "Como as pessoas verão você": "How others will know you", "Enviar link de redefinição": "Send reset link", "Esqueceu a senha?": "Forgot password?", "Já tem uma conta?": "Already have an account?", "Novo no Yugen?": "New to Yugen?", "Criar uma": "Create one",
  "Sua curadoria": "Personal curation", "Criar coleção": "Create collection", "Escolher coleção": "Choose collection", "Descrição": "Description", "O que conecta estas histórias?": "What ties these stories together?", "Manter esta coleção privada": "Keep this collection private",
  "Coleção criada": "Collection created", "Adicionado à coleção": "Added to collection", "Criar uma nova coleção": "Create a new collection", "Carregando capas…": "Loading covers…", "Animes selecionados com intenção.": "Anime, curated with intention.", "Plano de desenvolvimento": "Build blueprint",
  "Calendário": "Calendar", "Retome de onde parou": "Pick up where you left off", "Continuar assistindo": "Continue watching", "Abrir biblioteca": "Open library", "Com base na sua atividade": "Based on your activity", "Recomendados para você": "Recommended for you", "Com base na sua atividade e no catálogo ao vivo": "Based on your activity and the live catalog",
  "Progresso dos episódios": "Episode progress", "Diminuir episódio": "Decrease episode", "Marcar próximo episódio": "Mark next episode", "Sua nota": "Your score", "Salvando…": "Saving…", "Salvo na sua biblioteca.": "Saved to your library.", "Não foi possível salvar agora.": "Could not save right now.", "Favorito": "Favorite", "Favoritar": "Add to favorites",
  "Lançamentos da temporada atual": "Current season releases", "Sua semana": "Your week", "em episódios.": "in episodes.", "Acompanhe os animes em exibição e guarde os próximos episódios na sua biblioteca.": "Follow currently airing anime and keep upcoming episodes in your library.", "animes em exibição": "airing anime", "Dias da semana": "Days of the week", "Segunda": "Monday", "Terça": "Tuesday", "Quarta": "Wednesday", "Quinta": "Thursday", "Sexta": "Friday", "Sábado": "Saturday", "Domingo": "Sunday", "Destaques da temporada": "Season highlights", "Episódios em atualização": "Episodes updating", "Na biblioteca": "In library", "Lembrar-me": "Remind me",
  "Personagem indisponível.": "Character unavailable.", "Personagem · Jikan / MyAnimeList": "Character · Jikan / MyAnimeList", "favoritos na base": "database favorites", "aparições em destaque": "featured appearances", "Vozes": "Voices", "Dubladores": "Voice cast", "Filmografia": "Filmography", "Animes relacionados": "Related anime", "Ver personagem": "View character",
  "Escreva uma avaliação sobre história, personagens, animação ou trilha sonora…": "Write a review about story, characters, animation, or soundtrack…", "Contém spoiler": "Contains spoilers", "Publicar avaliação": "Post review", "Avaliação publicada": "Review posted", "Conteúdo marcado como spoiler — clique para revelar.": "Content marked as spoiler — click to reveal.",
  "Tempo assistido": "Watch time", "Animes concluídos": "Completed anime", "na sua biblioteca": "in your library", "Nota média": "Average score", "Favoritos": "Favorites", "histórias especiais": "special stories", "Sua jornada no Yugen": "Your Yugen journey", "Conquistas": "Achievements", "Primeiro passo": "First step", "Adicione seu primeiro anime": "Add your first anime", "Maratonista": "Marathoner", "Assista a 25 episódios": "Watch 25 episodes", "Crítico": "Critic", "Avalie 5 animes": "Rate 5 anime", "Curador": "Curator", "Favorite 10 animes": "Favorite 10 anime", "desbloqueadas": "unlocked", "Nenhum anime nesta lista ainda. Abra um anime e atualize seu progresso.": "No anime in this list yet. Open an anime and update your progress.",
  "Conteúdo com spoiler": "Spoiler content", "Clique para revelar": "Click to reveal", "Imagem anexada à publicação": "Image attached to post", "Votar": "Vote", "Seu voto foi registrado.": "Your vote has been recorded.", "Escolha uma opção": "Choose an option", "Imagem": "Image", "Cole o endereço de uma imagem": "Paste an image address", "Opção 1": "Option 1", "Opção 2": "Option 2", "Primeira opção": "First option", "Segunda opção": "Second option", "Esta publicação ficará oculta até o leitor escolher revelar.": "This post will stay hidden until the reader chooses to reveal it.",
  "Mais opções do comentário": "More comment options", "Copiar link": "Copy link", "Denunciar comentário": "Report comment", "Ocultar comentário": "Hide comment", "Link do comentário copiado.": "Comment link copied.", "Comentário enviado para análise da moderação.": "Comment sent for moderation review.", "Compartilhar publicação": "Share post", "Link da publicação copiado.": "Post link copied.",
  "Carregar mais animes": "Load more anime", "Carregando mais animes…": "Loading more anime…", "Todos os títulos retornados pela pesquisa foram carregados.": "All titles returned by this search have been loaded.", "títulos disponíveis": "available titles", "títulos carregados": "loaded titles",
  "Conversa vinculada a este anime": "Conversation linked to this anime", "Somente comentários publicados por usuários do Yugen aparecem aqui.": "Only comments posted by Yugen users appear here.", "Esta publicação ficará visível para toda a comunidade.": "This post will be visible to the whole community.", "Ainda não há discussões": "No discussions yet", "Seja a primeira pessoa a comentar sobre este anime.": "Be the first person to comment on this anime.",
  "Publicações recentes": "Recent posts", "Carregando discussões": "Loading discussions", "A comunidade está começando": "The community is just getting started", "Ainda não há publicações reais. Escolha um anime e inicie a primeira conversa.": "There are no real posts yet. Choose an anime and start the first conversation.", "Encontre uma conversa real": "Find a real conversation", "Pesquise nas publicações que já foram registradas no Yugen.": "Search posts already saved on Yugen.", "Pesquisar autor, anime ou texto": "Search author, anime, or text", "Tente outra busca.": "Try another search.", "Vincular anime": "Link anime", "Escolha um anime": "Choose an anime", "Entre para publicar uma discussão": "Log in to post a discussion",
  "Perfil Yugen": "Yugen profile", "Sua biblioteca, suas descobertas e suas discussões em um só lugar.": "Your library, discoveries, and discussions in one place.", "Enviando avatar…": "Uploading avatar…", "Enviando banner…": "Uploading banner…", "Avatar atualizado.": "Avatar updated.", "Banner atualizado.": "Banner updated.", "Enviando…": "Uploading…", "JPG, PNG, WebP ou GIF, com até 5 MB.": "JPG, PNG, WebP, or GIF up to 5 MB.", "Conte um pouco sobre você.": "Tell us a little about yourself.",
};

const es: Dictionary = {
  "Início": "Inicio", "Catálogo": "Catálogo", "Notícias": "Noticias", "Coleções": "Colecciones", "Discussões": "Discusiones", "Início do Yugen": "Inicio de Yugen", "Navegação principal": "Navegación principal",
  "Entrar": "Iniciar sesión", "Criar conta": "Crear cuenta", "Ver perfil": "Ver perfil", "Editar perfil": "Editar perfil", "Sair": "Cerrar sesión", "Voltar": "Volver",
  "Pesquisar anime": "Buscar anime", "Pesquise um anime pelo título…": "Busca un anime por título…", "Limpar pesquisa": "Limpiar búsqueda", "Sugestões de anime": "Sugerencias de anime",
  "Pressione Enter para pesquisar tudo": "Pulsa Enter para buscar todo", "Pesquisando na API de animes…": "Buscando en la API de anime…", "Não foi possível carregar as sugestões.": "No se pudieron cargar las sugerencias.",
  "Abrir pesquisa de anime": "Abrir búsqueda de anime", "Abrir ou fechar navegação": "Abrir o cerrar navegación", "Mudar para o modo claro": "Cambiar al modo claro", "Mudar para o modo escuro": "Cambiar al modo oscuro",
  "Abrir menu do perfil": "Abrir menú del perfil", "Atualizando pela Jikan": "Actualizando desde Jikan", "API de animes indisponível": "API de anime no disponible", "Destaque ao vivo · Jikan / MyAnimeList": "Destacado en vivo · Jikan / MyAnimeList",
  "Carregando": "Cargando", "Buscando os dados mais recentes dos animes…": "Buscando los datos más recientes del anime…", "Saiba mais": "Saber más", "Tentar novamente": "Intentar de nuevo", "Carregando…": "Cargando…",
  "Na sua lista": "En tu lista", "Quero assistir": "Quiero ver", "nota da comunidade": "puntuación de la comunidad", "episódios": "episodios", "classificação indicativa": "clasificación por edad", "ROLE PARA DESCOBRIR": "DESLIZA PARA DESCUBRIR",
  "Selecionado pelo gosto, não pelo ruído": "Elegido por gusto, no por ruido", "Histórias que valem": "Historias que merecen", "uma noite acordado.": "una noche en vela.",
  "O Yugen reúne descobertas, contexto e conversas da comunidade em um espaço tranquilo da internet.": "Yugen reúne descubrimientos, contexto y conversaciones de la comunidad en un rincón tranquilo de internet.",
  "Catálogo ao vivo · Jikan / MyAnimeList": "Catálogo en vivo · Jikan / MyAnimeList", "Especial para você": "Especial para ti", "Criadas pela comunidade": "Creadas por la comunidad", "Coleções em destaque": "Colecciones destacadas",
  "Explorar todas": "Explorar todas", "O que a comunidade não para de comentar": "Lo que la comunidad no deja de comentar", "Em alta agora": "Tendencias", "O cânone compartilhado": "El canon compartido", "Mais populares": "Más populares", "Ver catálogo": "Ver catálogo", "Mostrar mais": "Mostrar más", "Mostrar menos": "Mostrar menos",
  "Seu próximo favorito está esperando": "Tu próximo favorito te espera", "Guarde cada história": "Guarda cada historia", "por perto.": "cerca.", "Acompanhe o que assiste, crie coleções e encontre pessoas que enxergam as mesmas coisas que você.": "Sigue lo que ves, crea colecciones y encuentra personas que ven lo mismo que tú.", "Criar sua biblioteca": "Crear tu biblioteca",
  "Carregando dados dos animes": "Cargando datos de anime", "Não foi possível acessar o catálogo.": "No se pudo acceder al catálogo.", "Dados ao vivo da Jikan / MyAnimeList": "Datos en vivo de Jikan / MyAnimeList", "Encontre sua próxima": "Encuentra tu próxima", "obsessão.": "obsesión.",
  "Sinopses, trailers, personagens e detalhes de produção atualizados pela base de animes.": "Sinopsis, tráilers, personajes y detalles de producción actualizados desde la base de anime.", "Resultados para": "Resultados para", "Atualizando catálogo…": "Actualizando catálogo…", "Mostrando": "Mostrando", "de": "de",
  "Ordenar por": "Ordenar por", "Relevância": "Relevancia", "Popularidade": "Popularidad", "Nota": "Puntuación", "Mais recentes": "Más recientes", "Filtros": "Filtros", "Ano": "Año", "Ano inicial": "Año inicial", "Ano final": "Año final", "De": "Desde", "Até": "Hasta",
  "Temporada": "Temporada", "Todas": "Todas", "Gêneros": "Géneros", "Todos": "Todos", "Estúdio": "Estudio", "Todos os estúdios": "Todos los estudios", "Formato": "Formato", "Status de exibição": "Estado de emisión", "Todos os status": "Todos los estados", "Limpar todos os filtros": "Limpiar todos los filtros",
  "Nenhum anime encontrado.": "No se encontró ningún anime.", "Tente ampliar ou limpar os filtros.": "Amplía o limpia los filtros.", "A definir": "Por definir", "Série de TV": "Serie de TV", "Filme": "Película", "Especial": "Especial", "Clipe musical": "Video musical",
  "Inverno": "Invierno", "Primavera": "Primavera", "Verão": "Verano", "Outono": "Otoño", "Em exibição": "En emisión", "Exibição finalizada": "Emisión finalizada", "Ainda não exibido": "Aún no emitido", "Em breve": "Próximamente",
  "Ação": "Acción", "Aventura": "Aventura", "Premiado": "Premiado", "Comédia": "Comedia", "Fantasia": "Fantasía", "Terror": "Terror", "Mistério": "Misterio", "Ficção científica": "Ciencia ficción", "Cotidiano": "Vida cotidiana", "Esportes": "Deportes", "Sobrenatural": "Sobrenatural", "Gastronomia": "Gastronomía", "Vanguarda": "Vanguardia",
  "Anime não encontrado na API.": "Anime no encontrado en la API.", "Abrir catálogo da API": "Abrir catálogo de la API", "Carregando dados do anime": "Cargando datos del anime", "Dados do anime indisponíveis.": "Datos del anime no disponibles.", "Voltar ao catálogo": "Volver al catálogo", "Assistir ao trailer": "Ver tráiler", "Adicionar à coleção": "Añadir a colección", "Abertura": "Apertura", "Encerramento": "Cierre",
  "avaliações": "valoraciones", "Aguardando avaliações": "Esperando valoraciones", "Assistindo": "Viendo", "Assistido": "Visto", "Visão geral": "Resumen", "Relações": "Relaciones", "Personagens": "Personajes", "Equipe": "Equipo", "Músicas-tema": "Canciones temáticas", "Avaliações": "Reseñas",
  "Detalhes": "Detalles", "Episódios": "Episodios", "Duração": "Duración", "Exibição": "Emisión", "Status": "Estado", "Origem": "Origen", "Classificação": "Clasificación", "Desconhecido": "Desconocido", "Não informada": "No informada", "Não informado": "No informado", "Não classificado": "Sin clasificar", "Mangá": "Manga", "Jogo": "Juego",
  "Sinopse": "Sinopsis", "Sobre": "Sobre", "Traduzindo sinopse…": "Traduciendo sinopsis…", "Não foi possível traduzir a sinopse. Exibindo o texto original.": "No se pudo traducir la sinopsis. Mostrando el texto original.", "Dados da base": "Datos de la base", "nota no MyAnimeList": "puntuación en MyAnimeList", "posição de popularidade": "puesto de popularidad",
  "Obras conectadas": "Obras relacionadas", "Continuação": "Secuela", "Prequela": "Precuela", "História paralela": "Historia paralela", "Alternativa": "Alternativa", "Adaptação": "Adaptación", "Resumo": "Resumen", "Elenco principal e personagens coadjuvantes": "Reparto principal y secundario", "Principal": "Principal", "Coadjuvante": "Secundario", "Dublador não informado": "Actor de voz no informado", "voz em japonês": "voz en japonés",
  "As pessoas por trás da produção": "Las personas detrás de la producción", "Equipe de produção": "Equipo de producción", "Direção": "Dirección", "Composição da série": "Composición de la serie", "Roteiro": "Guion", "Design de personagens": "Diseño de personajes", "Música": "Música", "Criador original": "Creador original", "Direção de som": "Dirección de sonido", "Aberturas e encerramentos": "Aperturas y cierres", "TEMAS DE ABERTURA": "TEMAS DE APERTURA", "TEMAS DE ENCERRAMENTO": "TEMAS DE CIERRE",
  "Tópicos de episódios, teorias e recomendações": "Temas de episodios, teorías y recomendaciones", "Geral": "General", "Teorias": "Teorías", "Recomendações": "Recomendaciones", "Compartilhe uma teoria, observação ou pergunta…": "Comparte una teoría, observación o pregunta…", "Seja gentil. Marque conteúdos com spoilers.": "Sé amable. Marca los spoilers.", "Marcar como spoiler": "Marcar como spoiler", "Publicar comentário": "Publicar comentario", "Responder": "Responder", "Denunciar": "Denunciar",
  "Comunidade": "Comunidad", "Para você": "Para ti", "Explorar": "Explorar", "Notificações": "Notificaciones", "Salvos": "Guardados", "Perfil": "Perfil", "Nova publicação": "Nueva publicación", "Comunidade Yugen": "Comunidad Yugen", "Configurações das discussões": "Configuración de discusiones", "Atualizar feed": "Actualizar feed", "Visualização confortável": "Vista cómoda", "Visualização compacta": "Vista compacta", "Regras da comunidade": "Reglas de la comunidad", "Seguindo": "Siguiendo",
  "No que você está pensando?": "¿En qué estás pensando?", "Criar uma publicação": "Crear una publicación", "Adicionar imagem": "Añadir imagen", "Adicionar enquete": "Añadir encuesta", "Marcar spoiler": "Marcar spoiler", "Anexar anime": "Adjuntar anime", "Publicar": "Publicar", "Encontre sua próxima conversa": "Encuentra tu próxima conversación", "Explore a comunidade.": "Explora la comunidad.", "Pesquisar pessoas, animes ou tópicos": "Buscar personas, anime o temas", "Tudo": "Todo", "Teoria": "Teoría", "Episódio": "Episodio", "Análise": "Análisis",
  "Nenhuma discussão encontrada": "No se encontraron discusiones", "Tente outra busca ou categoria.": "Prueba otra búsqueda o categoría.", "Atividade ao seu redor": "Actividad a tu alrededor", "Continue na conversa.": "Sigue en la conversación.", "Marcar tudo como lido": "Marcar todo como leído", "Tudo em dia": "Todo al día", "Guardado para depois": "Guardado para después", "Suas publicações salvas.": "Tus publicaciones guardadas.", "Nada salvo ainda": "Aún no hay guardados", "Ver discussões": "Ver discusiones", "Pesquisar discussões": "Buscar discusiones", "O que está acontecendo": "Qué está pasando", "Em alta no Yugen": "Tendencia en Yugen", "Ao vivo da Jikan": "En vivo desde Jikan", "Quem seguir": "A quién seguir", "Seguir": "Seguir", "Privacidade": "Privacidad", "Termos": "Términos",
  "Coleções com": "Colecciones con", "um ponto de vista.": "un punto de vista.", "Criar nova": "Crear nueva", "Coleção": "Colección", "títulos": "títulos", "por": "por", "Abrir coleção": "Abrir colección", "Abrir anime": "Abrir anime", "Da redação": "Desde la redacción", "Últimas histórias": "Últimas historias", "Produção": "Producción", "Ensaios": "Ensayos",
  "Membro desde 2024": "Miembro desde 2024", "Seguidores": "Seguidores", "Assistidos": "Vistos", "Atualizados recentemente": "Actualizados recientemente", "Título": "Título", "Seu espaço": "Tu espacio", "Configurações": "Configuración", "da conta.": "de la cuenta.", "Conta": "Cuenta", "Importações": "Importaciones", "Zona de perigo": "Zona de peligro", "Identidade pública": "Identidad pública", "Alterar avatar": "Cambiar avatar", "Alterar banner": "Cambiar banner", "Nome de usuário": "Nombre de usuario", "Biografia": "Biografía", "Dados privados": "Datos privados", "Senha atual": "Contraseña actual", "Nova senha": "Nueva contraseña", "Pelo menos 12 caracteres": "Al menos 12 caracteres", "Salvar alterações": "Guardar cambios", "Alterações salvas": "Cambios guardados", "Traga seu histórico": "Trae tu historial", "Importar do MyAnimeList": "Importar de MyAnimeList", "Excluir conta": "Eliminar cuenta", "Cancelar": "Cancelar", "Fechar": "Cerrar",
  "Entre no Yugen": "Únete a Yugen", "Boas-vindas de volta": "Bienvenido de nuevo", "Redefinir senha": "Restablecer contraseña", "Sua biblioteca espera por você": "Tu biblioteca te espera", "Continuar com ChatGPT": "Continuar con ChatGPT", "Continuar com Google": "Continuar con Google", "Continuar com Apple": "Continuar con Apple", "ou continue com email": "o continúa con correo", "Como as pessoas verão você": "Cómo te verán los demás", "Enviar link de redefinição": "Enviar enlace de restablecimiento", "Esqueceu a senha?": "¿Olvidaste la contraseña?", "Já tem uma conta?": "¿Ya tienes una cuenta?", "Novo no Yugen?": "¿Nuevo en Yugen?", "Criar uma": "Crear una",
  "Sua curadoria": "Tu selección", "Criar coleção": "Crear colección", "Escolher coleção": "Elegir colección", "Descrição": "Descripción", "O que conecta estas histórias?": "¿Qué conecta estas historias?", "Manter esta coleção privada": "Mantener esta colección privada", "Coleção criada": "Colección creada", "Adicionado à coleção": "Añadido a la colección", "Criar uma nova coleção": "Crear una nueva colección", "Carregando capas…": "Cargando portadas…", "Animes selecionados com intenção.": "Anime seleccionado con intención.", "Plano de desenvolvimento": "Plan de desarrollo",
  "Calendário": "Calendario", "Retome de onde parou": "Retoma donde lo dejaste", "Continuar assistindo": "Seguir viendo", "Abrir biblioteca": "Abrir biblioteca", "Com base na sua atividade": "Según tu actividad", "Recomendados para você": "Recomendados para ti", "Com base na sua atividade e no catálogo ao vivo": "Según tu actividad y el catálogo en vivo",
  "Progresso dos episódios": "Progreso de episodios", "Diminuir episódio": "Disminuir episodio", "Marcar próximo episódio": "Marcar siguiente episodio", "Sua nota": "Tu puntuación", "Salvando…": "Guardando…", "Salvo na sua biblioteca.": "Guardado en tu biblioteca.", "Não foi possível salvar agora.": "No se pudo guardar ahora.", "Favorito": "Favorito", "Favoritar": "Añadir a favoritos",
  "Lançamentos da temporada atual": "Estrenos de la temporada actual", "Sua semana": "Tu semana", "em episódios.": "en episodios.", "Acompanhe os animes em exibição e guarde os próximos episódios na sua biblioteca.": "Sigue los animes en emisión y guarda los próximos episodios en tu biblioteca.", "animes em exibição": "animes en emisión", "Dias da semana": "Días de la semana", "Segunda": "Lunes", "Terça": "Martes", "Quarta": "Miércoles", "Quinta": "Jueves", "Sexta": "Viernes", "Sábado": "Sábado", "Domingo": "Domingo", "Destaques da temporada": "Destacados de la temporada", "Episódios em atualização": "Episodios en actualización", "Na biblioteca": "En la biblioteca", "Lembrar-me": "Recordarme",
  "Personagem indisponível.": "Personaje no disponible.", "Personagem · Jikan / MyAnimeList": "Personaje · Jikan / MyAnimeList", "favoritos na base": "favoritos en la base", "aparições em destaque": "apariciones destacadas", "Vozes": "Voces", "Dubladores": "Actores de voz", "Filmografia": "Filmografía", "Animes relacionados": "Animes relacionados", "Ver personagem": "Ver personaje",
  "Escreva uma avaliação sobre história, personagens, animação ou trilha sonora…": "Escribe una reseña sobre la historia, personajes, animación o banda sonora…", "Contém spoiler": "Contiene spoilers", "Publicar avaliação": "Publicar reseña", "Avaliação publicada": "Reseña publicada", "Conteúdo marcado como spoiler — clique para revelar.": "Contenido marcado como spoiler — haz clic para revelar.",
  "Tempo assistido": "Tiempo visto", "Animes concluídos": "Animes completados", "na sua biblioteca": "en tu biblioteca", "Nota média": "Puntuación media", "Favoritos": "Favoritos", "histórias especiais": "historias especiales", "Sua jornada no Yugen": "Tu recorrido en Yugen", "Conquistas": "Logros", "Primeiro passo": "Primer paso", "Adicione seu primeiro anime": "Añade tu primer anime", "Maratonista": "Maratonista", "Assista a 25 episódios": "Mira 25 episodios", "Crítico": "Crítico", "Avalie 5 animes": "Valora 5 animes", "Curador": "Curador", "Favorite 10 animes": "Añade 10 animes a favoritos", "desbloqueadas": "desbloqueados", "Nenhum anime nesta lista ainda. Abra um anime e atualize seu progresso.": "Aún no hay animes en esta lista. Abre un anime y actualiza tu progreso.",
  "Conteúdo com spoiler": "Contenido con spoiler", "Clique para revelar": "Haz clic para revelar", "Imagem anexada à publicação": "Imagen adjunta a la publicación", "Votar": "Votar", "Seu voto foi registrado.": "Tu voto fue registrado.", "Escolha uma opção": "Elige una opción", "Imagem": "Imagen", "Cole o endereço de uma imagem": "Pega la dirección de una imagen", "Opção 1": "Opción 1", "Opção 2": "Opción 2", "Primeira opção": "Primera opción", "Segunda opção": "Segunda opción", "Esta publicação ficará oculta até o leitor escolher revelar.": "Esta publicación permanecerá oculta hasta que el lector elija revelarla.",
  "Mais opções do comentário": "Más opciones del comentario", "Copiar link": "Copiar enlace", "Denunciar comentário": "Denunciar comentario", "Ocultar comentário": "Ocultar comentario", "Link do comentário copiado.": "Enlace del comentario copiado.", "Comentário enviado para análise da moderação.": "Comentario enviado a moderación.", "Compartilhar publicação": "Compartir publicación", "Link da publicação copiado.": "Enlace de la publicación copiado.",
  "Carregar mais animes": "Cargar más animes", "Carregando mais animes…": "Cargando más animes…", "Todos os títulos retornados pela pesquisa foram carregados.": "Se cargaron todos los títulos de esta búsqueda.", "títulos disponíveis": "títulos disponibles", "títulos carregados": "títulos cargados",
  "Conversa vinculada a este anime": "Conversación vinculada a este anime", "Somente comentários publicados por usuários do Yugen aparecem aqui.": "Aquí solo aparecen comentarios publicados por usuarios de Yugen.", "Esta publicação ficará visível para toda a comunidade.": "Esta publicación será visible para toda la comunidad.", "Ainda não há discussões": "Aún no hay discusiones", "Seja a primeira pessoa a comentar sobre este anime.": "Sé la primera persona en comentar este anime.",
  "Publicações recentes": "Publicaciones recientes", "Carregando discussões": "Cargando discusiones", "A comunidade está começando": "La comunidad está empezando", "Ainda não há publicações reais. Escolha um anime e inicie a primeira conversa.": "Aún no hay publicaciones reales. Elige un anime e inicia la primera conversación.", "Encontre uma conversa real": "Encuentra una conversación real", "Pesquise nas publicações que já foram registradas no Yugen.": "Busca en las publicaciones guardadas en Yugen.", "Pesquisar autor, anime ou texto": "Buscar autor, anime o texto", "Tente outra busca.": "Prueba otra búsqueda.", "Vincular anime": "Vincular anime", "Escolha um anime": "Elige un anime", "Entre para publicar uma discussão": "Inicia sesión para publicar una discusión",
  "Perfil Yugen": "Perfil de Yugen", "Sua biblioteca, suas descobertas e suas discussões em um só lugar.": "Tu biblioteca, descubrimientos y discusiones en un solo lugar.", "Enviando avatar…": "Subiendo avatar…", "Enviando banner…": "Subiendo banner…", "Avatar atualizado.": "Avatar actualizado.", "Banner atualizado.": "Banner actualizado.", "Enviando…": "Subiendo…", "JPG, PNG, WebP ou GIF, com até 5 MB.": "JPG, PNG, WebP o GIF de hasta 5 MB.", "Conte um pouco sobre você.": "Cuéntanos un poco sobre ti.",
};

Object.assign(en, {
  "Wiki": "Wiki",
  "Moderação da Wiki": "Wiki moderation",
  "Conhecimento construído pela comunidade": "Knowledge built by the community",
  "Wiki colaborativa": "Collaborative wiki",
  "Use os dados da Jikan como base e sugira correções. Nada é publicado antes da análise de um moderador.": "Use Jikan data as a starting point and suggest corrections. Nothing is published before a moderator reviews it.",
  "Abrir fila de moderação ↗": "Open moderation queue ↗",
  "Sugerir uma correção": "Suggest a correction",
  "Título em japonês": "Japanese title",
  "Resumo da alteração": "Change summary",
  "Explique o que foi corrigido e, se possível, informe a fonte.": "Explain what was corrected and, if possible, provide the source.",
  "Entre para colaborar com a Wiki.": "Log in to contribute to the Wiki.",
  "Enviar para análise": "Submit for review",
  "Entrar para editar": "Log in to edit",
  "Antes de enviar": "Before submitting",
  "Boas edições são verificáveis.": "Good edits can be verified.",
  "Corrija somente informações objetivas.": "Correct objective information only.",
  "Explique claramente o motivo da mudança.": "Clearly explain the reason for the change.",
  "Evite opiniões, spoilers e textos copiados integralmente.": "Avoid opinions, spoilers, and fully copied text.",
  "Uma edição aprovada aparece para todos, mas a Jikan continua indicada como fonte original.": "An approved edit appears for everyone, while Jikan remains credited as the original source.",
  "Transparência editorial": "Editorial transparency",
  "Histórico de alterações": "Revision history",
  "Carregando histórico": "Loading history",
  "Em análise": "Pending review",
  "Aprovada": "Approved",
  "Rejeitada": "Rejected",
  "Aprovar alteração": "Approve change",
  "Rejeitar": "Reject",
  "Nota da moderação:": "Moderator note:",
  "Controle editorial": "Editorial control",
  "Moderação": "Moderation",
  "da Wiki.": "of the Wiki.",
  "Compare cada proposta com o dado atual antes de publicar para toda a comunidade.": "Compare each proposal with the current data before publishing it to the community.",
  "Atualizar fila": "Refresh queue",
  "Revisão de anime": "Anime revision",
  "Nota da moderação": "Moderator note",
  "Opcional ao aprovar; obrigatória ao rejeitar.": "Optional when approving; required when rejecting.",
  "Aprovar e publicar": "Approve and publish",
  "Carregando revisões": "Loading revisions",
  "Acesso indisponível": "Access unavailable",
  "Fila de moderação vazia": "Moderation queue is empty",
  "Não há sugestões aguardando análise.": "There are no suggestions awaiting review.",
  "Respostas, curtidas, seguidores e decisões da Wiki aparecem aqui quando acontecerem.": "Replies, likes, followers, and Wiki decisions appear here when they happen.",
  "Quando alguém responder, curtir, seguir você ou analisar sua edição, a atividade aparecerá aqui.": "When someone replies, likes, follows you, or reviews your edit, the activity will appear here.",
});

Object.assign(es, {
  "Wiki": "Wiki",
  "Moderação da Wiki": "Moderación de la Wiki",
  "Conhecimento construído pela comunidade": "Conocimiento construido por la comunidad",
  "Wiki colaborativa": "Wiki colaborativa",
  "Use os dados da Jikan como base e sugira correções. Nada é publicado antes da análise de um moderador.": "Usa los datos de Jikan como base y sugiere correcciones. Nada se publica antes de la revisión de un moderador.",
  "Abrir fila de moderação ↗": "Abrir cola de moderación ↗",
  "Sugerir uma correção": "Sugerir una corrección",
  "Título em japonês": "Título en japonés",
  "Resumo da alteração": "Resumen del cambio",
  "Explique o que foi corrigido e, se possível, informe a fonte.": "Explica qué se corrigió y, si es posible, indica la fuente.",
  "Entre para colaborar com a Wiki.": "Inicia sesión para colaborar con la Wiki.",
  "Enviar para análise": "Enviar a revisión",
  "Entrar para editar": "Iniciar sesión para editar",
  "Antes de enviar": "Antes de enviar",
  "Boas edições são verificáveis.": "Las buenas ediciones son verificables.",
  "Corrija somente informações objetivas.": "Corrige solo información objetiva.",
  "Explique claramente o motivo da mudança.": "Explica claramente el motivo del cambio.",
  "Evite opiniões, spoilers e textos copiados integralmente.": "Evita opiniones, spoilers y textos copiados íntegramente.",
  "Uma edição aprovada aparece para todos, mas a Jikan continua indicada como fonte original.": "Una edición aprobada aparece para todos, pero Jikan sigue indicada como fuente original.",
  "Transparência editorial": "Transparencia editorial",
  "Histórico de alterações": "Historial de cambios",
  "Carregando histórico": "Cargando historial",
  "Em análise": "En revisión",
  "Aprovada": "Aprobada",
  "Rejeitada": "Rechazada",
  "Aprovar alteração": "Aprobar cambio",
  "Rejeitar": "Rechazar",
  "Nota da moderação:": "Nota de moderación:",
  "Controle editorial": "Control editorial",
  "Moderação": "Moderación",
  "da Wiki.": "de la Wiki.",
  "Compare cada proposta com o dado atual antes de publicar para toda a comunidade.": "Compara cada propuesta con el dato actual antes de publicarla para la comunidad.",
  "Atualizar fila": "Actualizar cola",
  "Revisão de anime": "Revisión de anime",
  "Nota da moderação": "Nota de moderación",
  "Opcional ao aprovar; obrigatória ao rejeitar.": "Opcional al aprobar; obligatoria al rechazar.",
  "Aprovar e publicar": "Aprobar y publicar",
  "Carregando revisões": "Cargando revisiones",
  "Acesso indisponível": "Acceso no disponible",
  "Fila de moderação vazia": "La cola de moderación está vacía",
  "Não há sugestões aguardando análise.": "No hay sugerencias pendientes de revisión.",
  "Respostas, curtidas, seguidores e decisões da Wiki aparecem aqui quando acontecerem.": "Las respuestas, me gusta, seguidores y decisiones de la Wiki aparecen aquí cuando ocurren.",
  "Quando alguém responder, curtir, seguir você ou analisar sua edição, a atividade aparecerá aqui.": "Cuando alguien responda, indique que le gusta, te siga o revise tu edición, la actividad aparecerá aquí.",
});

Object.assign(en, {
  "Biblioteca avançada": "Advanced library",
  "Seu histórico, do seu jeito": "Your history, your way",
  "Uma biblioteca que": "A library that",
  "acompanha você.": "keeps up with you.",
  "Entre para importar sua lista, registrar episódios, definir metas e receber lembretes.": "Sign in to import your list, track episodes, set goals, and receive reminders.",
  "Entrar no Yugen": "Sign in to Yugen",
  "Seu ritmo.": "Your pace.",
  "Sua história.": "Your story.",
  "Progresso, estatísticas, importações e próximos episódios reunidos em um só lugar.": "Progress, stats, imports, and upcoming episodes in one place.",
  "títulos na biblioteca": "titles in your library",
  "Meta desta semana": "This week's goal",
  "Meta concluída. Continue no seu ritmo.": "Goal complete. Keep going at your own pace.",
  "concluído": "complete",
  "Meta de episódios": "Episode goal",
  "Atualizar meta": "Update goal",
  "Meta semanal atualizada.": "Weekly goal updated.",
  "Importação real": "Real import",
  "Use seu nome de usuário do MAL. Sua lista precisa estar pública; o Yugen apenas lê os dados e não altera sua conta original.": "Use your MAL username. Your list must be public; Yugen only reads the data and never changes your original account.",
  "Nome de usuário no MAL": "MAL username",
  "Importar ou atualizar lista": "Import or update list",
  "Lendo sua lista pública no MyAnimeList…": "Reading your public MyAnimeList list…",
  "Visão geral": "Overview",
  "Seus status": "Your statuses",
  "Nota média pessoal": "Personal average score",
  "Seu perfil de espectador": "Your viewer profile",
  "Estatísticas": "Statistics",
  "Gêneros mais vistos": "Most watched genres",
  "Estúdios recorrentes": "Recurring studios",
  "Registro automático": "Automatic log",
  "Histórico de episódios": "Episode history",
  "Marque um episódio como assistido para iniciar seu histórico.": "Mark an episode as watched to start your history.",
  "Próximos episódios": "Upcoming episodes",
  "Lembretes": "Reminders",
  "Ative “Lembrar episódios” em um anime em exibição ou no calendário.": "Enable “Remind me about episodes” on an airing anime or in the calendar.",
  "Abrir calendário semanal →": "Open weekly calendar →",
  "Auditoria": "Audit trail",
  "Importações recentes": "Recent imports",
  "Biblioteca": "Library",
  "＋ Lembrar episódios": "＋ Remind me about episodes",
  "✓ Lembrete ativo": "✓ Reminder active",
  "Abrir importador do MyAnimeList ↗": "Open MyAnimeList importer ↗",
  "Respostas, curtidas, seguidores, lembretes de episódios e decisões da Wiki aparecem aqui quando acontecerem.": "Replies, likes, followers, episode reminders, and Wiki decisions appear here as they happen.",
  "Quando alguém responder, curtir, seguir você, analisar sua edição ou chegar o dia de um anime lembrado, a atividade aparecerá aqui.": "When someone replies, likes, follows you, reviews your edit, or a reminded anime airs, the activity will appear here.",
});

Object.assign(es, {
  "Biblioteca avançada": "Biblioteca avanzada",
  "Seu histórico, do seu jeito": "Tu historial, a tu manera",
  "Uma biblioteca que": "Una biblioteca que",
  "acompanha você.": "te acompaña.",
  "Entre para importar sua lista, registrar episódios, definir metas e receber lembretes.": "Inicia sesión para importar tu lista, registrar episodios, definir metas y recibir recordatorios.",
  "Entrar no Yugen": "Entrar en Yugen",
  "Seu ritmo.": "Tu ritmo.",
  "Sua história.": "Tu historia.",
  "Progresso, estatísticas, importações e próximos episódios reunidos em um só lugar.": "Progreso, estadísticas, importaciones y próximos episodios en un solo lugar.",
  "títulos na biblioteca": "títulos en tu biblioteca",
  "Meta desta semana": "Meta de esta semana",
  "Meta concluída. Continue no seu ritmo.": "Meta completada. Continúa a tu ritmo.",
  "concluído": "completado",
  "Meta de episódios": "Meta de episodios",
  "Atualizar meta": "Actualizar meta",
  "Meta semanal atualizada.": "Meta semanal actualizada.",
  "Importação real": "Importación real",
  "Use seu nome de usuário do MAL. Sua lista precisa estar pública; o Yugen apenas lê os dados e não altera sua conta original.": "Usa tu nombre de usuario de MAL. Tu lista debe ser pública; Yugen solo lee los datos y no modifica tu cuenta original.",
  "Nome de usuário no MAL": "Usuario de MAL",
  "Importar ou atualizar lista": "Importar o actualizar lista",
  "Lendo sua lista pública no MyAnimeList…": "Leyendo tu lista pública de MyAnimeList…",
  "Visão geral": "Resumen",
  "Seus status": "Tus estados",
  "Nota média pessoal": "Puntuación media personal",
  "Seu perfil de espectador": "Tu perfil de espectador",
  "Estatísticas": "Estadísticas",
  "Gêneros mais vistos": "Géneros más vistos",
  "Estúdios recorrentes": "Estudios recurrentes",
  "Registro automático": "Registro automático",
  "Histórico de episódios": "Historial de episodios",
  "Marque um episódio como assistido para iniciar seu histórico.": "Marca un episodio como visto para iniciar tu historial.",
  "Próximos episódios": "Próximos episodios",
  "Lembretes": "Recordatorios",
  "Ative “Lembrar episódios” em um anime em exibição ou no calendário.": "Activa “Recordar episodios” en un anime en emisión o en el calendario.",
  "Abrir calendário semanal →": "Abrir calendario semanal →",
  "Auditoria": "Auditoría",
  "Importações recentes": "Importaciones recientes",
  "Biblioteca": "Biblioteca",
  "＋ Lembrar episódios": "＋ Recordar episodios",
  "✓ Lembrete ativo": "✓ Recordatorio activo",
  "Abrir importador do MyAnimeList ↗": "Abrir importador de MyAnimeList ↗",
  "Respostas, curtidas, seguidores, lembretes de episódios e decisões da Wiki aparecem aqui quando acontecerem.": "Las respuestas, me gusta, seguidores, recordatorios de episodios y decisiones de la Wiki aparecen aquí cuando ocurren.",
  "Quando alguém responder, curtir, seguir você, analisar sua edição ou chegar o dia de um anime lembrado, a atividade aparecerá aqui.": "Cuando alguien responda, indique que le gusta, te siga, revise tu edición o llegue el día de un anime recordado, la actividad aparecerá aquí.",
});

Object.assign(en, {
  "Central administrativa": "Admin center",
  "Participação na comunidade suspensa": "Community participation suspended",
  "Sua biblioteca continua disponível.": "Your library remains available.",
  "Acesso exclusivo de administrador": "Administrator-only access",
  "Central de": "Moderation",
  "moderação.": "center.",
  "Analise denúncias reais, proteja a comunidade e mantenha um histórico verificável de cada decisão.": "Review real reports, protect the community, and keep a verifiable history of every decision.",
  "↻ Atualizar central": "↻ Refresh center",
  "Denúncias abertas": "Open reports",
  "Usuários suspensos": "Suspended users",
  "Tópicos bloqueados": "Locked threads",
  "Contas listadas": "Listed accounts",
  "Denúncias": "Reports",
  "Usuários": "Users",
  "Auditoria": "Audit log",
  "Aberta": "Open",
  "Resolvida": "Resolved",
  "Descartada": "Dismissed",
  "Comentário": "Comment",
  "Avaliação": "Review",
  "Conteúdo excluído pela moderação": "Content deleted by moderation",
  "Conteúdo ocultado pela moderação": "Content hidden by moderation",
  "Nota interna": "Internal note",
  "Analisar": "Review",
  "Ocultar": "Hide",
  "Excluir": "Delete",
  "Bloquear tópico": "Lock thread",
  "Desbloquear tópico": "Unlock thread",
  "Descartar": "Dismiss",
  "Ação administrativa aplicada e registrada.": "Administrative action applied and logged.",
  "Nenhuma denúncia registrada": "No reports registered",
  "Quando a comunidade denunciar um comentário ou avaliação, o item aparecerá aqui.": "When the community reports a comment or review, it will appear here.",
  "Pesquisar por usuário ou email": "Search by username or email",
  "Pesquisar": "Search",
  "Administrador": "Administrator",
  "Reativar conta": "Reactivate account",
  "Motivo da suspensão": "Suspension reason",
  "Suspender": "Suspend",
  "Permanente": "Permanent",
  "Discussão geral": "General discussion",
  "Abrir ↗": "Open ↗",
  "Desbloquear": "Unlock",
  "Bloquear": "Lock",
  "Nenhuma discussão criada": "No discussions created",
  "Fila da Wiki vazia": "Wiki queue is empty",
  "Nenhuma ação registrada": "No actions logged",
  "Sem nota adicional.": "No additional note.",
  "Discussão bloqueada pela administração": "Discussion locked by administration",
  "O conteúdo continua disponível para leitura, mas novas respostas estão desativadas.": "The content remains available to read, but new replies are disabled.",
});

Object.assign(es, {
  "Central administrativa": "Central administrativa",
  "Participação na comunidade suspensa": "Participación en la comunidad suspendida",
  "Sua biblioteca continua disponível.": "Tu biblioteca sigue disponible.",
  "Acesso exclusivo de administrador": "Acceso exclusivo de administrador",
  "Central de": "Central de",
  "moderação.": "moderación.",
  "Analise denúncias reais, proteja a comunidade e mantenha um histórico verificável de cada decisão.": "Analiza denuncias reales, protege a la comunidad y mantén un historial verificable de cada decisión.",
  "↻ Atualizar central": "↻ Actualizar central",
  "Denúncias abertas": "Denuncias abiertas",
  "Usuários suspensos": "Usuarios suspendidos",
  "Tópicos bloqueados": "Temas bloqueados",
  "Contas listadas": "Cuentas listadas",
  "Denúncias": "Denuncias",
  "Usuários": "Usuarios",
  "Auditoria": "Auditoría",
  "Aberta": "Abierta",
  "Resolvida": "Resuelta",
  "Descartada": "Descartada",
  "Comentário": "Comentario",
  "Avaliação": "Reseña",
  "Conteúdo excluído pela moderação": "Contenido eliminado por moderación",
  "Conteúdo ocultado pela moderação": "Contenido ocultado por moderación",
  "Nota interna": "Nota interna",
  "Analisar": "Analizar",
  "Ocultar": "Ocultar",
  "Excluir": "Eliminar",
  "Bloquear tópico": "Bloquear tema",
  "Desbloquear tópico": "Desbloquear tema",
  "Descartar": "Descartar",
  "Ação administrativa aplicada e registrada.": "Acción administrativa aplicada y registrada.",
  "Nenhuma denúncia registrada": "No hay denuncias registradas",
  "Quando a comunidade denunciar um comentário ou avaliação, o item aparecerá aqui.": "Cuando la comunidad denuncie un comentario o reseña, aparecerá aquí.",
  "Pesquisar por usuário ou email": "Buscar por usuario o correo",
  "Pesquisar": "Buscar",
  "Administrador": "Administrador",
  "Reativar conta": "Reactivar cuenta",
  "Motivo da suspensão": "Motivo de la suspensión",
  "Suspender": "Suspender",
  "Permanente": "Permanente",
  "Discussão geral": "Discusión general",
  "Abrir ↗": "Abrir ↗",
  "Desbloquear": "Desbloquear",
  "Bloquear": "Bloquear",
  "Nenhuma discussão criada": "No hay discusiones creadas",
  "Fila da Wiki vazia": "La cola de la Wiki está vacía",
  "Nenhuma ação registrada": "No hay acciones registradas",
  "Sem nota adicional.": "Sin nota adicional.",
  "Discussão bloqueada pela administração": "Discusión bloqueada por la administración",
  "O conteúdo continua disponível para leitura, mas novas respostas estão desativadas.": "El contenido sigue disponible para leer, pero las nuevas respuestas están desactivadas.",
});

const dictionaries: Record<Exclude<Language, "pt">, Dictionary> = { en, es };
const originalText = new WeakMap<Node, string>();
const appliedText = new WeakMap<Node, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const appliedAttributes = new WeakMap<Element, Map<string, string>>();

function preserveSpacing(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

export function translateInterfaceText(
  source: string,
  language: Language,
): string {
  if (language === "pt") return source;
  const dictionary = dictionaries[language];
  const trimmed = source.trim();
  if (!trimmed) return source;
  if (dictionary[trimmed]) return preserveSpacing(source, dictionary[trimmed]);

  const carouselControls = trimmed.match(/^Controles do carrossel (.+)$/u);
  if (carouselControls) return preserveSpacing(source, language === "en" ? `Carousel controls for ${translateInterfaceText(carouselControls[1], language).trim()}` : `Controles del carrusel ${translateInterfaceText(carouselControls[1], language).trim()}`);
  const previousItems = trimmed.match(/^Itens anteriores em (.+)$/u);
  if (previousItems) return preserveSpacing(source, language === "en" ? `Previous items in ${translateInterfaceText(previousItems[1], language).trim()}` : `Elementos anteriores en ${translateInterfaceText(previousItems[1], language).trim()}`);
  const nextItems = trimmed.match(/^Próximos itens em (.+)$/u);
  if (nextItems) return preserveSpacing(source, language === "en" ? `Next items in ${translateInterfaceText(nextItems[1], language).trim()}` : `Siguientes elementos en ${translateInterfaceText(nextItems[1], language).trim()}`);

  const translated = trimmed;
  const dynamicPatterns: Array<[RegExp, string]> = language === "en" ? [
    [/^Pôster de (.+)$/u, "Poster of $1"], [/^Abrir (.+)$/u, "Open $1"], [/^Trailer de (.+)$/u, "$1 trailer"], [/^▶ Assistir ao trailer$/u, "▶ Watch trailer"], [/^＋ Adicionar à coleção$/u, "＋ Add to collection"],
    [/^Sugestões para “(.+)”$/u, "Suggestions for “$1”"], [/^Ver todos os resultados para “(.+)”$/u, "View all results for “$1”"],
    [/^Nenhum anime encontrado para “(.+)”\.$/u, "No anime found for “$1”."], [/^([\d.]+) títulos$/u, "$1 titles"], [/^([\d.]+) avaliações$/u, "$1 ratings"],
    [/^([\d.]+) títulos · por @(.+)$/u, "$1 titles · by @$2"], [/^\+ Quero assistir$/u, "+ To watch"], [/^✓ Na sua lista$/u, "✓ In your list"],
    [/^Episódio ([\d]+) de (.+)$/u, "Episode $1 of $2"], [/^([\d]+) lançamentos$/u, "$1 releases"], [/^([\d]+) de ([\d]+) desbloqueadas$/u, "$1 of $2 unlocked"], [/^([\d]+) animes em exibição$/u, "$1 airing anime"], [/^([\d]+) aparições em destaque$/u, "$1 featured appearances"],
    [/^por @(.+)$/u, "by @$1"], [/^Responder a @(.+)$/u, "Reply to @$1"], [/^Silenciar @(.+)$/u, "Mute @$1"],
    [/^(\d+) de (\d+) episódios$/u, "$1 of $2 episodes"], [/^Faltam (\d+) episódios para concluir\.$/u, "$1 episodes left to complete."], [/^(\d+) atividades$/u, "$1 activities"], [/^(\d+) ativos$/u, "$1 active"],
    [/^(\d+) animes importados de @(.+)\.$/u, "$1 anime imported from @$2."], [/^Última importação: (.+)$/u, "Last import: $1"], [/^Avançou para o episódio (\d+)$/u, "Advanced to episode $1"], [/^Progresso ajustado para (\d+)$/u, "Progress adjusted to $1"],
    [/^Novo episódio de (.+) é exibido hoje$/u, "A new episode of $1 airs today"], [/^Horário informado pela Jikan: (.+)\.$/u, "Time provided by Jikan: $1."],
  ] : [
    [/^Pôster de (.+)$/u, "Póster de $1"], [/^Abrir (.+)$/u, "Abrir $1"], [/^Trailer de (.+)$/u, "Tráiler de $1"], [/^▶ Assistir ao trailer$/u, "▶ Ver tráiler"], [/^＋ Adicionar à coleção$/u, "＋ Añadir a colección"],
    [/^Sugestões para “(.+)”$/u, "Sugerencias para “$1”"], [/^Ver todos os resultados para “(.+)”$/u, "Ver todos los resultados para “$1”"],
    [/^Nenhum anime encontrado para “(.+)”\.$/u, "No se encontró anime para “$1”."], [/^([\d.]+) títulos$/u, "$1 títulos"], [/^([\d.]+) avaliações$/u, "$1 valoraciones"],
    [/^([\d.]+) títulos · por @(.+)$/u, "$1 títulos · por @$2"], [/^\+ Quero assistir$/u, "+ Quiero ver"], [/^✓ Na sua lista$/u, "✓ En tu lista"],
    [/^Episódio ([\d]+) de (.+)$/u, "Episodio $1 de $2"], [/^([\d]+) lançamentos$/u, "$1 estrenos"], [/^([\d]+) de ([\d]+) desbloqueadas$/u, "$1 de $2 desbloqueados"], [/^([\d]+) animes em exibição$/u, "$1 animes en emisión"], [/^([\d]+) aparições em destaque$/u, "$1 apariciones destacadas"],
    [/^por @(.+)$/u, "por @$1"], [/^Responder a @(.+)$/u, "Responder a @$1"], [/^Silenciar @(.+)$/u, "Silenciar @$1"],
    [/^(\d+) de (\d+) episódios$/u, "$1 de $2 episodios"], [/^Faltam (\d+) episódios para concluir\.$/u, "Faltan $1 episodios para completar."], [/^(\d+) atividades$/u, "$1 actividades"], [/^(\d+) ativos$/u, "$1 activos"],
    [/^(\d+) animes importados de @(.+)\.$/u, "$1 animes importados de @$2."], [/^Última importação: (.+)$/u, "Última importación: $1"], [/^Avançou para o episódio (\d+)$/u, "Avanzó al episodio $1"], [/^Progresso ajustado para (\d+)$/u, "Progreso ajustado a $1"],
    [/^Novo episódio de (.+) é exibido hoje$/u, "Un nuevo episodio de $1 se emite hoy"], [/^Horário informado pela Jikan: (.+)\.$/u, "Horario informado por Jikan: $1."],
  ];
  for (const [pattern, replacement] of dynamicPatterns) {
    if (pattern.test(translated)) return preserveSpacing(source, translated.replace(pattern, replacement));
  }
  const metadataTokens: Dictionary = language === "en" ? {
    "Ação": "Action", "Aventura": "Adventure", "Premiado": "Award winning", "Comédia": "Comedy", "Fantasia": "Fantasy", "Terror": "Horror", "Mistério": "Mystery", "Ficção científica": "Sci-Fi", "Cotidiano": "Slice of life", "Esportes": "Sports", "Sobrenatural": "Supernatural", "Gastronomia": "Gourmet", "Vanguarda": "Avant garde",
    "Série de TV": "TV series", "Filme": "Movie", "Clipe musical": "Music video", "Inverno": "Winter", "Primavera": "Spring", "Verão": "Summer", "Outono": "Fall", "Em exibição": "Airing", "Exibição finalizada": "Finished airing", "Ainda não exibido": "Not yet aired", "Não informada": "Not provided", "Não informado": "Not provided", " por episódio": " per episode",
    "jan.": "Jan", "fev.": "Feb", "mar.": "Mar", "abr.": "Apr", "mai.": "May", "jun.": "Jun", "jul.": "Jul", "ago.": "Aug", "set.": "Sep", "out.": "Oct", "nov.": "Nov", "dez.": "Dec", "violência e linguagem imprópria": "violence and profanity", "nudez leve": "mild nudity",
  } : {
    "Ação": "Acción", "Aventura": "Aventura", "Premiado": "Premiado", "Comédia": "Comedia", "Fantasia": "Fantasía", "Terror": "Terror", "Mistério": "Misterio", "Ficção científica": "Ciencia ficción", "Cotidiano": "Vida cotidiana", "Esportes": "Deportes", "Sobrenatural": "Sobrenatural", "Gastronomia": "Gastronomía", "Vanguarda": "Vanguardia",
    "Série de TV": "Serie de TV", "Filme": "Película", "Clipe musical": "Video musical", "Inverno": "Invierno", "Primavera": "Primavera", "Verão": "Verano", "Outono": "Otoño", "Em exibição": "En emisión", "Exibição finalizada": "Emisión finalizada", "Ainda não exibido": "Aún no emitido", "Não informada": "No informada", "Não informado": "No informado", " por episódio": " por episodio",
    "jan.": "ene.", "fev.": "feb.", "mar.": "mar.", "abr.": "abr.", "mai.": "may.", "jun.": "jun.", "jul.": "jul.", "ago.": "ago.", "set.": "sep.", "out.": "oct.", "nov.": "nov.", "dez.": "dic.", "violência e linguagem imprópria": "violencia y lenguaje inapropiado", "nudez leve": "desnudez leve",
  };
  let metadata = trimmed;
  for (const [token, replacement] of Object.entries(metadataTokens)) metadata = metadata.replaceAll(token, replacement);
  if (metadata !== trimmed) return preserveSpacing(source, metadata);
  return source;
}

function translateNode(node: Node, language: Language) {
  if (!node.parentElement || node.parentElement.closest("[data-no-translate], script, style")) return;
  const current = node.nodeValue || "";
  const previousApplied = appliedText.get(node);
  let source = originalText.get(node);
  if (source === undefined || (previousApplied !== undefined && current !== previousApplied)) {
    source = current;
    originalText.set(node, source);
  }
  const next = translateInterfaceText(source, language);
  appliedText.set(node, next);
  if (current !== next) node.nodeValue = next;
}

function translateAttributes(element: Element, language: Language) {
  if (element.closest("[data-no-translate]")) return;
  const attributes = ["aria-label", "placeholder", "title"];
  const sources = originalAttributes.get(element) || new Map<string, string>();
  const applied = appliedAttributes.get(element) || new Map<string, string>();
  for (const attribute of attributes) {
    const current = element.getAttribute(attribute);
    if (current === null) continue;
    if (!sources.has(attribute) || (applied.has(attribute) && current !== applied.get(attribute))) sources.set(attribute, current);
    const next = translateInterfaceText(sources.get(attribute) || current, language);
    applied.set(attribute, next);
    if (current !== next) element.setAttribute(attribute, next);
  }
  originalAttributes.set(element, sources);
  appliedAttributes.set(element, applied);
}

export function applyDocumentLanguage(language: Language) {
  if (!document.body) return;
  document.documentElement.lang = languageOptions.find((item) => item.value === language)?.htmlLang || "pt-BR";
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateNode(node, language);
    node = walker.nextNode();
  }
  document.body.querySelectorAll("[aria-label], [placeholder], [title]").forEach((element) => translateAttributes(element, language));
}

export function observeDocumentLanguage(language: Language) {
  let queued = false;
  const apply = () => {
    queued = false;
    applyDocumentLanguage(language);
  };
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(apply);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title"] });
  applyDocumentLanguage(language);
  return () => observer.disconnect();
}
