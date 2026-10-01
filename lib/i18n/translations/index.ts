export type TranslationType = {
  common: {
    hello: string;
    cancel: string;
    save: string;
    saving: string;
    error: string;
    success: string;
    minutes_abbr: string;
  };
  dashboard: {
    day_streak: string;
    day: string;
    streak_start: string;
    streak_continue: string;
    streak_serious: string;
    streak_legend: string;
    longest_streak: string;
    weekly_workouts: string;
    recent_workouts: string;
    see_all: string;
  };
  profile: {
    edit_profile: string;
    display_name: string;
    your_name: string;
    current_streak: string;
    longest_streak_title: string;
    logout: string;
    privacy_policy: string;
    terms_of_use: string;
    delete_account: string;
    delete_account_confirm: string;
    logout_dialog_title: string;
    logout_dialog_message: string;
    profile_error: string;
    select_language: string;
  };
  feed: {
    title: string;
    like: string;
    liked: string;
    comment: string;
    comments: string;
    post_button: string;
    post_placeholder: string;
    no_posts: string;
  };
  notifications: {
    title: string;
    clear_all: string;
    no_notifications: string;
  };
};

export const translations: Record<string, TranslationType> = {
  tr: {
    common: {
      hello: "SELAM",
      cancel: "İPTAL",
      save: "KAYDET",
      saving: "KAYDEDİLİYOR...",
      error: "Hata",
      success: "Başarılı",
      minutes_abbr: "dk"
    },
    dashboard: {
      day_streak: "GÜNLÜK STREAK",
      day: "GÜN",
      streak_start: "Hadi başla, ilk antrenmanını logla.",
      streak_continue: "İyi gidiyorsun, devam!",
      streak_serious: "Sen ciddi bir adamsın artık.",
      streak_legend: "Efsanesin. Bu streak korkutucu.",
      longest_streak: "En uzun streak",
      weekly_workouts: "Bu hafta antrenman",
      recent_workouts: "SON ANTRENMANLAR",
      see_all: "TÜMÜNÜ GÖR"
    },
    profile: {
      edit_profile: "PROFİLİ DÜZENLE",
      display_name: "GÖRÜNÜR AD",
      your_name: "Adınız",
      current_streak: "GÜNCEL STREAK",
      longest_streak_title: "EN UZUN",
      logout: "Çıkış Yap",
      privacy_policy: "Gizlilik Politikası",
      terms_of_use: "Kullanım Şartları",
      delete_account: "Hesabımı Sil",
      delete_account_confirm: "Hesabınız ve tüm verileriniz kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?",
      logout_dialog_title: "Çıkış",
      logout_dialog_message: "Emin misin?",
      profile_error: "Profil güncellenemedi.",
      select_language: "DİL SEÇİMİ"
    },
    feed: {
      title: "AKIŞ",
      like: "Beğen",
      liked: "Beğendin",
      comment: "Yorum",
      comments: "Yorumlar",
      post_button: "Paylaş",
      post_placeholder: "Antrenmanın nasıl geçti?...",
      no_posts: "Henüz gönderi yok."
    },
    notifications: {
      title: "BİLDİRİMLER",
      clear_all: "TEMİZLE",
      no_notifications: "Hiç bildiriminiz yok."
    }
  },
  en: {
    common: {
      hello: "HELLO",
      cancel: "CANCEL",
      save: "SAVE",
      saving: "SAVING...",
      error: "Error",
      success: "Success",
      minutes_abbr: "min"
    },
    dashboard: {
      day_streak: "DAY STREAK",
      day: "DAY",
      streak_start: "Let's start! Log your first workout.",
      streak_continue: "Doing great, keep it up!",
      streak_serious: "You are getting serious now.",
      streak_legend: "Legendary! This streak is scary.",
      longest_streak: "Longest streak",
      weekly_workouts: "Workouts this week",
      recent_workouts: "RECENT WORKOUTS",
      see_all: "SEE ALL"
    },
    profile: {
      edit_profile: "EDIT PROFILE",
      display_name: "DISPLAY NAME",
      your_name: "Your Name",
      current_streak: "CURRENT STREAK",
      longest_streak_title: "LONGEST",
      logout: "Log Out",
      privacy_policy: "Privacy Policy",
      terms_of_use: "Terms of Use",
      delete_account: "Delete Account",
      delete_account_confirm: "Your account and all your data will be permanently deleted. This cannot be undone. Do you want to continue?",
      logout_dialog_title: "Log Out",
      logout_dialog_message: "Are you sure?",
      profile_error: "Failed to update profile.",
      select_language: "SELECT LANGUAGE"
    },
    feed: {
      title: "FEED",
      like: "Like",
      liked: "Liked",
      comment: "Comment",
      comments: "Comments",
      post_button: "Share",
      post_placeholder: "How was your workout?...",
      no_posts: "No posts yet."
    },
    notifications: {
      title: "NOTIFICATIONS",
      clear_all: "CLEAR",
      no_notifications: "You have no notifications."
    }
  },
  de: {
    common: {
      hello: "HALLO",
      cancel: "ABBRECHEN",
      save: "SPEICHERN",
      saving: "SPEICHERT...",
      error: "Fehler",
      success: "Erfolgreich",
      minutes_abbr: "Min"
    },
    dashboard: {
      day_streak: "TAGE-STREAK",
      day: "TAG",
      streak_start: "Fangen wir an! Logge dein erstes Workout.",
      streak_continue: "Sehr gut, mach weiter so!",
      streak_serious: "Es wird langsam ernst.",
      streak_legend: "Legendär! Dieser Streak ist beängstigend.",
      longest_streak: "Längster Streak",
      weekly_workouts: "Workouts diese Woche",
      recent_workouts: "LETZTE WORKOUTS",
      see_all: "ALLE SEHEN"
    },
    profile: {
      edit_profile: "PROFIL BEARBEITEN",
      display_name: "ANZEIGENAME",
      your_name: "Ihr Name",
      current_streak: "AKTUELLER STREAK",
      longest_streak_title: "LÄNGSTER",
      logout: "Abmelden",
      privacy_policy: "Datenschutz",
      terms_of_use: "Nutzungsbedingungen",
      delete_account: "Konto löschen",
      delete_account_confirm: "Um Ihr Konto zu löschen, senden Sie eine E-Mail an support@vitatribe.com. Ihre Daten werden innerhalb von 30 Tagen gelöscht.",
      logout_dialog_title: "Abmelden",
      logout_dialog_message: "Sind Sie sicher?",
      profile_error: "Profil konnte nicht aktualisiert werden.",
      select_language: "SPRACHE WÄHLEN"
    },
    feed: {
      title: "FEED",
      like: "Gefällt mir",
      liked: "Gefällt dir",
      comment: "Kommentar",
      comments: "Kommentare",
      post_button: "Teilen",
      post_placeholder: "Wie war dein Workout?...",
      no_posts: "Noch keine Beiträge."
    },
    notifications: {
      title: "BENACHRICHTIGUNGEN",
      clear_all: "LÖSCHEN",
      no_notifications: "Keine Benachrichtigungen."
    }
  },
  fr: {
    common: {
      hello: "BONJOUR",
      cancel: "ANNULER",
      save: "ENREGISTRER",
      saving: "ENREGISTREMENT...",
      error: "Erreur",
      success: "Succès",
      minutes_abbr: "min"
    },
    dashboard: {
      day_streak: "SÉRIE DE JOURS",
      day: "JOUR",
      streak_start: "C'est parti ! Enregistrez votre premier entraînement.",
      streak_continue: "Super, continuez !",
      streak_serious: "Ça devient sérieux maintenant.",
      streak_legend: "Légendaire ! Cette série est effrayante.",
      longest_streak: "Plus longue série",
      weekly_workouts: "Entraînements cette semaine",
      recent_workouts: "ENTRAÎNEMENTS RÉCENTS",
      see_all: "VOIR TOUT"
    },
    profile: {
      edit_profile: "MODIFIER LE PROFIL",
      display_name: "NOM D'AFFICHAGE",
      your_name: "Votre Nom",
      current_streak: "SÉRIE ACTUELLE",
      longest_streak_title: "MAX",
      logout: "Se déconnecter",
      privacy_policy: "Confidentialité",
      terms_of_use: "Conditions d'utilisation",
      delete_account: "Supprimer le compte",
      delete_account_confirm: "Pour supprimer votre compte, vous pouvez envoyer un e-mail à support@vitatribe.com. Toutes vos données seront supprimées sous 30 jours.",
      logout_dialog_title: "Se déconnecter",
      logout_dialog_message: "Êtes-vous sûr ?",
      profile_error: "Échec de la mise à jour du profil.",
      select_language: "CHOISIR LA LANGUE"
    },
    feed: {
      title: "ACTUALITÉS",
      like: "J'aime",
      liked: "Aimé",
      comment: "Commentaire",
      comments: "Commentaires",
      post_button: "Partager",
      post_placeholder: "Comment s'est passé votre entraînement ?...",
      no_posts: "Aucun post pour le moment."
    },
    notifications: {
      title: "NOTIFICATIONS",
      clear_all: "EFFACER",
      no_notifications: "Vous n'avez pas de notifications."
    }
  },
  it: {
    common: {
      hello: "CIAO",
      cancel: "ANNULLA",
      save: "SALVA",
      saving: "SALVATAGGIO...",
      error: "Errore",
      success: "Successo",
      minutes_abbr: "min"
    },
    dashboard: {
      day_streak: "STREAK DI GIORNI",
      day: "GIORNO",
      streak_start: "Iniziamo! Registra il tuo primo allenamento.",
      streak_continue: "Grande, continua così!",
      streak_serious: "Ora si fa sul serio.",
      streak_legend: "Legendario! Questo streak fa paura.",
      longest_streak: "Streak più lungo",
      weekly_workouts: "Allenamenti questa settimana",
      recent_workouts: "ALLENAMENTI RECENTI",
      see_all: "VEDI TUTTI"
    },
    profile: {
      edit_profile: "MODIFICA PROFILO",
      display_name: "NOME VISUALIZZATO",
      your_name: "Il tuo nome",
      current_streak: "STREAK ATTUALE",
      longest_streak_title: "PIÙ LUNGO",
      logout: "Disconnetti",
      privacy_policy: "Privacy",
      terms_of_use: "Termini di servizio",
      delete_account: "Elimina account",
      delete_account_confirm: "Per eliminare il tuo account, invia un'email a support@vitatribe.com. I tuoi dati saranno rimossi entro 30 giorni.",
      logout_dialog_title: "Disconnetti",
      logout_dialog_message: "Sei sicuro?",
      profile_error: "Impossibile aggiornare il profilo.",
      select_language: "SELEZIONA LINGUA"
    },
    feed: {
      title: "BACHECA",
      like: "Mi piace",
      liked: "Ti piace",
      comment: "Commento",
      comments: "Commenti",
      post_button: "Condividi",
      post_placeholder: "Com'è andato l'allenamento?...",
      no_posts: "Nessun post ancora."
    },
    notifications: {
      title: "NOTIFICHE",
      clear_all: "CANCELLA",
      no_notifications: "Non hai notifiche."
    }
  },
  es: {
    common: {
      hello: "HOLA",
      cancel: "CANCELAR",
      save: "GUARDAR",
      saving: "GUARDANDO...",
      error: "Error",
      success: "Éxito",
      minutes_abbr: "min"
    },
    dashboard: {
      day_streak: "RACHA DE DÍAS",
      day: "DÍA",
      streak_start: "¡Empecemos! Registra tu primer entrenamiento.",
      streak_continue: "¡Vas genial, sigue así!",
      streak_serious: "Esto se está poniendo serio.",
      streak_legend: "¡Legendario! Esta racha asusta.",
      longest_streak: "Racha más larga",
      weekly_workouts: "Entrenamientos esta semana",
      recent_workouts: "ENTRENAMIENTOS RECIENTES",
      see_all: "VER TODO"
    },
    profile: {
      edit_profile: "EDITAR PERFIL",
      display_name: "NOMBRE PÚBLICO",
      your_name: "Tu Nombre",
      current_streak: "RACHA ACTUAL",
      longest_streak_title: "MÁS LARGA",
      logout: "Cerrar sesión",
      privacy_policy: "Privacidad",
      terms_of_use: "Términos de uso",
      delete_account: "Eliminar cuenta",
      delete_account_confirm: "Para eliminar tu cuenta, envía un correo a support@vitatribe.com. Todos tus datos se eliminarán en 30 días.",
      logout_dialog_title: "Cerrar sesión",
      logout_dialog_message: "¿Estás seguro?",
      profile_error: "No se pudo actualizar el perfil.",
      select_language: "SELECCIONAR IDIOMA"
    },
    feed: {
      title: "INICIO",
      like: "Me gusta",
      liked: "Te gusta",
      comment: "Comentar",
      comments: "Comentarios",
      post_button: "Compartir",
      post_placeholder: "¿Cómo estuvo tu entrenamiento?...",
      no_posts: "No hay publicaciones aún."
    },
    notifications: {
      title: "NOTIFICACIONES",
      clear_all: "LIMPIAR",
      no_notifications: "No tienes notificaciones."
    }
  },
  pt: {
    common: {
      hello: "OLÁ",
      cancel: "CANCELAR",
      save: "SALVAR",
      saving: "SALVANDO...",
      error: "Erro",
      success: "Sucesso",
      minutes_abbr: "min"
    },
    dashboard: {
      day_streak: "OFENSIVA DE DIAS",
      day: "DIA",
      streak_start: "Vamos começar! Registre seu primeiro treino.",
      streak_continue: "Indo muito bem, continue assim!",
      streak_serious: "Ficando sério agora.",
      streak_legend: "Lendário! Essa ofensiva assusta.",
      longest_streak: "Maior ofensiva",
      weekly_workouts: "Treinos esta semana",
      recent_workouts: "TREINOS RECENTES",
      see_all: "VER TUDO"
    },
    profile: {
      edit_profile: "EDITAR PERFIL",
      display_name: "NOME DE EXIBIÇÃO",
      your_name: "Seu Nome",
      current_streak: "OFENSIVA ATUAL",
      longest_streak_title: "RECORDE",
      logout: "Sair",
      privacy_policy: "Privacidade",
      terms_of_use: "Termos de uso",
      delete_account: "Excluir conta",
      delete_account_confirm: "Para excluir sua conta, envie um e-mail para support@vitatribe.com. Todos os seus dados serão excluídos em até 30 dias.",
      logout_dialog_title: "Sair",
      logout_dialog_message: "Tem certeza?",
      profile_error: "Falha ao atualizar o perfil.",
      select_language: "SELECIONAR IDIOMA"
    },
    feed: {
      title: "FEED",
      like: "Curtir",
      liked: "Curtido",
      comment: "Comentar",
      comments: "Comentários",
      post_button: "Compartilhar",
      post_placeholder: "Como foi seu treino?...",
      no_posts: "Nenhuma publicação ainda."
    },
    notifications: {
      title: "NOTIFICAÇÕES",
      clear_all: "LIMPAR",
      no_notifications: "Você não tem notificações."
    }
  },
  ru: {
    common: {
      hello: "ПРИВЕТ",
      cancel: "ОТМЕНА",
      save: "СОХРАНИТЬ",
      saving: "СОХРАНЕНИЕ...",
      error: "Ошибка",
      success: "Успешно",
      minutes_abbr: "мин"
    },
    dashboard: {
      day_streak: "СЕРИЯ ДНЕЙ",
      day: "ДЕНЬ",
      streak_start: "Давай начнем! Запиши свою первую тренировку.",
      streak_continue: "Отлично идешь, продолжай!",
      streak_serious: "Теперь всё серьезно.",
      streak_legend: "Легендарно! Эта серия пугает.",
      longest_streak: "Лучшая серия",
      weekly_workouts: "Тренировки на этой неделе",
      recent_workouts: "ПОСЛЕДНИЕ ТРЕНИРОВКИ",
      see_all: "СМОТРЕТЬ ВСЕ"
    },
    profile: {
      edit_profile: "ИЗМЕНИТЬ ПРОФИЛЬ",
      display_name: "ОТОБРАЖАЕМОЕ ИМЯ",
      your_name: "Ваше имя",
      current_streak: "ТЕКУЩАЯ СЕРИЯ",
      longest_streak_title: "РЕКОРД",
      logout: "Выйти",
      privacy_policy: "Конфиденциальность",
      terms_of_use: "Условия использования",
      delete_account: "Удалить аккаунт",
      delete_account_confirm: "Чтобы удалить свой аккаунт, напишите на support@vitatribe.com. Данные будут удалены в течение 30 дней.",
      logout_dialog_title: "Выйти",
      logout_dialog_message: "Вы уверены?",
      profile_error: "Не удалось обновить профиль.",
      select_language: "ВЫБРАТЬ ЯЗЫК"
    },
    feed: {
      title: "ЛЕНТА",
      like: "Нравится",
      liked: "Понравилось",
      comment: "Комментировать",
      comments: "Комментарии",
      post_button: "Поделиться",
      post_placeholder: "Как прошла тренировка?...",
      no_posts: "Публикаций пока нет."
    },
    notifications: {
      title: "УВЕДОМЛЕНИЯ",
      clear_all: "ОЧИСТИТЬ",
      no_notifications: "У вас нет уведомлений."
    }
  },
  uk: {
    common: {
      hello: "ПРИВІТ",
      cancel: "СКАСУВАТИ",
      save: "ЗБЕРЕГТИ",
      saving: "ЗБЕРЕЖЕННЯ...",
      error: "Помилка",
      success: "Успішно",
      minutes_abbr: "хв"
    },
    dashboard: {
      day_streak: "СЕРІЯ ДНІВ",
      day: "ДЕНЬ",
      streak_start: "Давай почнемо! Запиши перше тренування.",
      streak_continue: "Чудово йдеш, продовжуй!",
      streak_serious: "Тепер все серйозно.",
      streak_legend: "Легендарно! Ця серія лякає.",
      longest_streak: "Найкраща серія",
      weekly_workouts: "Тренування цього тижня",
      recent_workouts: "ОСТАННІ ТРЕНУВАННЯ",
      see_all: "ДИВИТИСЬ ВСЕ"
    },
    profile: {
      edit_profile: "РЕДАГУВАТИ ПРОФІЛЬ",
      display_name: "ІМ'Я ДЛЯ ВІДОБРАЖЕННЯ",
      your_name: "Ваше ім'я",
      current_streak: "ПОТОЧНА СЕРІЯ",
      longest_streak_title: "РЕКОРД",
      logout: "Вийти",
      privacy_policy: "Конфіденційність",
      terms_of_use: "Умови використання",
      delete_account: "Видалити акаунт",
      delete_account_confirm: "Щоб видалити акаунт, напишіть на support@vitatribe.com. Дані будуть видалені протягом 30 днів.",
      logout_dialog_title: "Вийти",
      logout_dialog_message: "Ви впевнені?",
      profile_error: "Не вдалося оновити профіль.",
      select_language: "ВИБРАТИ МОВУ"
    },
    feed: {
      title: "СТРІЧКА",
      like: "Подобається",
      liked: "Сподобалось",
      comment: "Коментувати",
      comments: "Коментарі",
      post_button: "Поділитися",
      post_placeholder: "Як пройшло тренування?...",
      no_posts: "Дописів поки немає."
    },
    notifications: {
      title: "СПОВІЩЕННЯ",
      clear_all: "ОЧИСТИТЬ",
      no_notifications: "У вас немає сповіщень."
    }
  },
  zh: {
    common: {
      hello: "你好",
      cancel: "取消",
      save: "保存",
      saving: "保存中...",
      error: "错误",
      success: "成功",
      minutes_abbr: "分钟"
    },
    dashboard: {
      day_streak: "连续天数",
      day: "天",
      streak_start: "开始吧！记录你的第一次训练。",
      streak_continue: "做得好，继续保持！",
      streak_serious: "你开始认真起来了。",
      streak_legend: "不可思议！这个连续纪录太惊人了。",
      longest_streak: "最长连续记录",
      weekly_workouts: "本周训练次数",
      recent_workouts: "最近训练",
      see_all: "查看全部"
    },
    profile: {
      edit_profile: "编辑个人资料",
      display_name: "显示名称",
      your_name: "您的姓名",
      current_streak: "当前连续",
      longest_streak_title: "最长",
      logout: "退出登录",
      privacy_policy: "隐私政策",
      terms_of_use: "使用条款",
      delete_account: "删除账号",
      delete_account_confirm: "要删除您的账号，您可以发送电子邮件至 support@vitatribe.com。您的所有数据将在 30 天内删除。",
      logout_dialog_title: "退出登录",
      logout_dialog_message: "您确定要退出吗？",
      profile_error: "更新个人资料失败。",
      select_language: "选择语言"
    },
    feed: {
      title: "动态",
      like: "点赞",
      liked: "已赞",
      comment: "评论",
      comments: "评论",
      post_button: "发布",
      post_placeholder: "你的训练怎么样？...",
      no_posts: "暂无动态。"
    },
    notifications: {
      title: "通知",
      clear_all: "清空",
      no_notifications: "暂无通知。"
    }
  },
  ja: {
    common: {
      hello: "こんにちは",
      cancel: "キャンセル",
      save: "保存",
      saving: "保存中...",
      error: "エラー",
      success: "成功",
      minutes_abbr: "分"
    },
    dashboard: {
      day_streak: "連続日数",
      day: "日",
      streak_start: "始めましょう！最初のワークアウトを記録します。",
      streak_continue: "その調子！続けていきましょう！",
      streak_serious: "本格的になってきましたね。",
      streak_legend: "素晴らしい！驚異的な連続記録です。",
      longest_streak: "最長連続記録",
      weekly_workouts: "今週のワークアウト",
      recent_workouts: "最近のワークアウト",
      see_all: "すべて見る"
    },
    profile: {
      edit_profile: "プロフィールを編集",
      display_name: "表示名",
      your_name: "お名前",
      current_streak: "現在の連続記録",
      longest_streak_title: "最長",
      logout: "ログアウト",
      privacy_policy: "プライバシーポリシー",
      terms_of_use: "利用規約",
      delete_account: "アカウントを削除",
      delete_account_confirm: "アカウントを削除するには、support@vitatribe.com までメールをお送りください。30日以内にすべてのデータが削除されます。",
      logout_dialog_title: "ログアウト",
      logout_dialog_message: "本当にログアウトしますか？",
      profile_error: "プロフィールの更新に失敗しました。",
      select_language: "言語の選択"
    },
    feed: {
      title: "フィード",
      like: "いいね",
      liked: "いいねしました",
      comment: "コメント",
      comments: "コメント",
      post_button: "投稿する",
      post_placeholder: "ワークアウトはいかがでしたか？...",
      no_posts: "投稿はまだありません。"
    },
    notifications: {
      title: "通知",
      clear_all: "クリア",
      no_notifications: "通知はありません。"
    }
  },
  ko: {
    common: {
      hello: "안녕하세요",
      cancel: "취소",
      save: "저장",
      saving: "저장 중...",
      error: "오류",
      success: "성공",
      minutes_abbr: "분"
    },
    dashboard: {
      day_streak: "연속 일수",
      day: "일",
      streak_start: "시작해 볼까요! 첫 운동을 기록하세요.",
      streak_continue: "잘하고 있어요. 계속 파이팅!",
      streak_serious: "이제 진짜 진지해졌네요.",
      streak_legend: "전설적입니다! 무시무시한 기록이네요.",
      longest_streak: "최장 연속 기록",
      weekly_workouts: "이번 주 운동 횟수",
      recent_workouts: "최근 운동",
      see_all: "전체 보기"
    },
    profile: {
      edit_profile: "프로필 편집",
      display_name: "이름",
      your_name: "이름",
      current_streak: "현재 연속 기록",
      longest_streak_title: "최장",
      logout: "로그아웃",
      privacy_policy: "개인정보 처리방침",
      terms_of_use: "이용약관",
      delete_account: "계정 탈퇴",
      delete_account_confirm: "계정을 탈퇴하려면 support@vitatribe.com으로 이메일을 보내주세요. 30일 이내에 모든 데이터가 삭제됩니다.",
      logout_dialog_title: "로그아웃",
      logout_dialog_message: "정말 로그아웃하시겠습니까?",
      profile_error: "프로필 업데이트에 실패했습니다.",
      select_language: "언어 선택"
    },
    feed: {
      title: "피드",
      like: "좋아요",
      liked: "좋아요 취소",
      comment: "댓글",
      comments: "댓글",
      post_button: "공유",
      post_placeholder: "오늘 운동은 어땠나요?...",
      no_posts: "아직 게시물이 없습니다."
    },
    notifications: {
      title: "알림",
      clear_all: "삭제",
      no_notifications: "알림이 없습니다."
    }
  },
  hi: {
    common: {
      hello: "नमस्ते",
      cancel: "रद्द करें",
      save: "सहेजें",
      saving: "सहेजा जा रहा है...",
      error: "त्रुटि",
      success: "सफल",
      minutes_abbr: "मिनट"
    },
    dashboard: {
      day_streak: "दिनों का सिलसिला",
      day: "दिन",
      streak_start: "चलिए शुरू करते हैं! अपना पहला वर्कआउट लॉग करें।",
      streak_continue: "शानदार कर रहे हैं, जारी रखें!",
      streak_serious: "अब आप गंभीर हो रहे हैं।",
      streak_legend: "अद्भुत! यह सिलसिला डरावना है।",
      longest_streak: "सबसे लंबा सिलसिला",
      weekly_workouts: "इस सप्ताह के वर्कआउट",
      recent_workouts: "हालिया वर्कआउट",
      see_all: "सभी देखें"
    },
    profile: {
      edit_profile: "प्रोफ़ाइल संपादित करें",
      display_name: "प्रदर्शित नाम",
      your_name: "आपका नाम",
      current_streak: "वर्तमान सिलसिला",
      longest_streak_title: "सबसे लंबा",
      logout: "लॉग आउट",
      privacy_policy: "गोपनीयता नीति",
      terms_of_use: "उपयोग की शर्तें",
      delete_account: "खाता हटाएं",
      delete_account_confirm: "अपना खाता हटाने के लिए, आप support@vitatribe.com पर ईमेल भेज सकते हैं। आपका सारा डेटा 30 दिनों के भीतर हटा दिया जाएगा।",
      logout_dialog_title: "लॉग आउट",
      logout_dialog_message: "क्या आप निश्चित हैं?",
      profile_error: "प्रोफ़ाइल अपडेट करने में विफल।",
      select_language: "भाषा चुनें"
    },
    feed: {
      title: "फ़ीड",
      like: "पसंद करें",
      liked: "पसंद किया",
      comment: "टिप्पणी",
      comments: "टिप्पणियाँ",
      post_button: "साझा करें",
      post_placeholder: "आपका वर्कआउट कैसा रहा?...",
      no_posts: "अभी तक कोई पोस्ट नहीं है।"
    },
    notifications: {
      title: "सूचनाएं",
      clear_all: "साफ़ करें",
      no_notifications: "आपके पास कोई सूचना नहीं है।"
    }
  },
  el: {
    common: {
      hello: "ΓΕΙΑ",
      cancel: "ΑΚΥΡΩΣΗ",
      save: "ΑΠΟΘΗΚΕΥΣΗ",
      saving: "ΑΠΟΘΗΚΕΥΣΗ...",
      error: "Σφάλμα",
      success: "Επιτυχία",
      minutes_abbr: "λεπ"
    },
    dashboard: {
      day_streak: "ΣΕΡΙ ΗΜΕΡΩΝ",
      day: "ΗΜΕΡΑ",
      streak_start: "Ας ξεκινήσουμε! Καταγράψτε την πρώτη σας προπόνηση.",
      streak_continue: "Πάει πολύ καλά, συνεχίστε έτσι!",
      streak_serious: "Τώρα σοβαρεύουν τα πράγματα.",
      streak_legend: "Θρυλικό! Αυτό το σερί προκαλεί τρόμο.",
      longest_streak: "Μεγαλύτερο σερί",
      weekly_workouts: "Προπονήσεις αυτή την εβδομάδα",
      recent_workouts: "ΠΡΟΣΦΑΤΕΣ ΠΡΟΠΟΝΗΣΕΙΣ",
      see_all: "ΠΡΟΒΟΛΗ ΟΛΩΝ"
    },
    profile: {
      edit_profile: "ΕΠΕΞΕΡΓΑΣΙΑ ΠΡΟΦΙΛ",
      display_name: "ΟΝΟΜΑ ΕΜΦΑΝΙΣΗΣ",
      your_name: "Το Όνομά σας",
      current_streak: "ΤΡΕΧΟΝ ΣΕΡΙ",
      longest_streak_title: "ΜΕΓΑΛΥΤΕΡΟ",
      logout: "Αποσύνδεση",
      privacy_policy: "Πολιτική Απορρήτου",
      terms_of_use: "Όροι Χρήσης",
      delete_account: "Διαγραφή Λογαριασμού",
      delete_account_confirm: "Για να διαγράψετε τον λογαριασμό σας, στείλτε ένα email στο support@vitatribe.com. Όλα τα δεδομένα σας θα διαγραφούν εντός 30 ημερών.",
      logout_dialog_title: "Αποσύνδεση",
      logout_dialog_message: "Είστε σίγουροι;",
      profile_error: "Αποτυχία ενημέρωσης προφίλ.",
      select_language: "ΕΠΙΛΟΓΗ ΓΛΩΣΣΑΣ"
    },
    feed: {
      title: "ΡΟΗ",
      like: "Μου αρέσει",
      liked: "Σας αρέσει",
      comment: "Σχόλιο",
      comments: "Σχόλια",
      post_button: "Κοινοποίηση",
      post_placeholder: "Πώς πήγε η προπόνησή σας;...",
      no_posts: "Δεν υπάρχουν δημοσιεύσεις ακόμα."
    },
    notifications: {
      title: "ΕΙΔΟΠΟΙΗΣΕΙΣ",
      clear_all: "ΚΑΘΑΡΙΣΜΟΣ",
      no_notifications: "Δεν έχετε ειδοποιήσεις."
    }
  },
  ar: {
    common: {
      hello: "مرحباً",
      cancel: "إلغاء",
      save: "حفظ",
      saving: "جاري الحفظ...",
      error: "خطأ",
      success: "نجاح",
      minutes_abbr: "دقيقة"
    },
    dashboard: {
      day_streak: "سلسلة الأيام",
      day: "يوم",
      streak_start: "ابدأ الآن! سجّل تمرينك الأول.",
      streak_continue: "أنت تبلي بلاءً حسناً، واصل!",
      streak_serious: "أنت تأخذ الأمر بجدية الآن.",
      streak_legend: "أسطوري! هذه السلسلة مذهلة.",
      longest_streak: "أطول سلسلة",
      weekly_workouts: "تمارين هذا الأسبوع",
      recent_workouts: "التمارين الأخيرة",
      see_all: "عرض الكل"
    },
    profile: {
      edit_profile: "تعديل الملف الشخصي",
      display_name: "الاسم المعروض",
      your_name: "اسمك",
      current_streak: "السلسلة الحالية",
      longest_streak_title: "الأطول",
      logout: "تسجيل الخروج",
      privacy_policy: "سياسة الخصوصية",
      terms_of_use: "شروط الاستخدام",
      delete_account: "حذف الحساب",
      delete_account_confirm: "لحذف حسابك، يرجى مراسلتنا عبر support@vitatribe.com.",
      logout_dialog_title: "تسجيل الخروج",
      logout_dialog_message: "هل أنت تأكد؟",
      profile_error: "فشل تحديث الملف الشخصي.",
      select_language: "اختر اللغة"
    },
    feed: {
      title: "المنشورات",
      like: "إعجاب",
      liked: "أعجبك",
      comment: "تعليق",
      comments: "تعليقات",
      post_button: "نشر",
      post_placeholder: "كيف كان تمرينك اليوم؟...",
      no_posts: "لا توجد منشورات حتى الآن."
    },
    notifications: {
      title: "الإشعارات",
      clear_all: "مسح الكل",
      no_notifications: "لا توجد إشعارات لديك."
    }
  },
  nl: {
    common: {
      hello: "HALLO",
      cancel: "ANNULEREN",
      save: "OPSLAAN",
      saving: "OPSLAAN...",
      error: "Fout",
      success: "Succes",
      minutes_abbr: "min"
    },
    dashboard: {
      day_streak: "DAGELIJKSE REEKS",
      day: "DAG",
      streak_start: "Laten we beginnen! Log je eerste workout.",
      streak_continue: "Ga zo door!",
      streak_serious: "Je bent nu echt serieus bezig.",
      streak_legend: "Legendarisch! Wat een reeks.",
      longest_streak: "Langste reeks",
      weekly_workouts: "Workouts deze week",
      recent_workouts: "RECENTE WORKOUTS",
      see_all: "ALLES BEKIJKEN"
    },
    profile: {
      edit_profile: "PROFIEL BEWERKEN",
      display_name: "WEERGAVENAAM",
      your_name: "Jouw Naam",
      current_streak: "HUIDIGE REEKS",
      longest_streak_title: "LANGSTE",
      logout: "Uitloggen",
      privacy_policy: "Privacybeleid",
      terms_of_use: "Gebruiksvoorwaarden",
      delete_account: "Account Verwijderen",
      delete_account_confirm: "Stuur een e-mail naar support@vitatribe.com om je account te verwijderen.",
      logout_dialog_title: "Uitloggen",
      logout_dialog_message: "Weet je het zeker?",
      profile_error: "Profiel bijwerken mislukt.",
      select_language: "TAAL SELECTEREN"
    },
    feed: {
      title: "FEED",
      like: "Vind ik leuk",
      liked: "Vind je leuk",
      comment: "Reactie",
      comments: "Reacties",
      post_button: "Delen",
      post_placeholder: "Hoe ging je workout?...",
      no_posts: "Nog geen berichten."
    },
    notifications: {
      title: "MELDINGEN",
      clear_all: "ALLES WISSEN",
      no_notifications: "Geen meldingen."
    }
  }
};
