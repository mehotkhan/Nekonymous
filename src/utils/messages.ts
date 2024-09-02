export const WelcomeMessage = `
سلام!
به نِکونیموس خوش آمدید.
لینک ناشناس شما:
UUID_USER_URL
استفاده از این لینک به شما اجازه می‌دهد که به صورت ناشناس با دیگران ارتباط برقرار کنید. لینک خود را با دیگران به اشتراک بگذارید و منتظر پیام‌های ناشناس باشید!
`;

export const USER_LINK_MESSAGE = `
لینک ناشناس شما:
 
UUID_USER_URL
این لینک را با دیگران به اشتراک بگذارید تا بتوانید پیام‌های ناشناس دریافت کنید.
`;

export const StartConversationMessage = `
شما در حال ارسال پیام ناشناس به USER_NAME هستید.
پیام خود را بنویسید و ارسال کنید. توجه داشته باشید که تمامی پیام‌ها به صورت رمزنگاری شده ارسال می‌شوند و حریم خصوصی شما حفظ خواهد شد.
`;

export const HuhMessage = `
به نظر می‌رسد مشکلی وجود دارد!
لطفاً دوباره تلاش کنید یا از دستورهای موجود استفاده کنید.
`;

export const NoUserFoundMessage = `
این حساب کاربری وجود ندارد!
لطفاً از درستی لینک یا شناسه وارد شده اطمینان حاصل کنید.
`;

export const NoConversationFoundMessage = `
مکالمه‌ای برای این شناسه یافت نشد!
ممکن است لینک یا شناسه نامعتبر باشد.
`;

export const MESSAGE_SENT_MESSAGE = `
پیام شما با موفقیت ارسال شد!
منتظر پاسخ باشید.
`;

export const USER_BLOCKED_MESSAGE = `
این کاربر بلاک شد و دیگر نمی‌تواند به شما پیام ارسال کند.
`;

export const USER_UNBLOCKED_MESSAGE = `
این کاربر از بلاک خارج شد و می‌تواند دوباره به شما پیام ارسال کند.
`;

export const REPLAY_TO_MESSAGE = `
پاسخ خود را بنویسید:
پیام شما مستقیماً به فرستنده ارسال خواهد شد.
`;

export const MESSAGE_SEEN_MESSAGE = `
پیام شما توسط گیرنده مشاهده شد.
`;

export const YOU_ARE_BLOCKED_MESSAGE = `
شما توسط این کاربر بلاک شده‌اید و نمی‌توانید پیام ارسال کنید.
لطفاً از ارسال پیام بیشتر خودداری کنید.
`;

export const USER_IS_BLOCKED_MESSAGE = `
شما بلاک شده‌اید و نمی‌توانید با این کاربر ارتباط برقرار کنید.
ارتباط شما با این کاربر محدود شده است.
`;

export const YOU_ARE_UNBLOCKED_MESSAGE = `
شما از بلاک خارج شدید و اکنون می‌توانید پیام ارسال کنید.
محدودیت‌های قبلی برداشته شده است.
`;

export const ABOUT_PRIVACY_COMMAND_MESSAGE = `
درباره نِکونیموس:
نِکونیموس یک ربات امن و ناشناس برای ارسال پیام‌های رمزنگاری شده است. این ربات به شما امکان می‌دهد تا با حفظ حریم خصوصی کامل و بدون افشای هویت خود با دیگران ارتباط برقرار کنید. نِکونیموس با استفاده از الگوریتم‌های رمزنگاری پیشرفته، امنیت تمامی مکالمات شما را تضمین می‌کند.

ویژگی‌های نِکونیموس:
- حفظ حریم خصوصی کامل: پیام‌های شما به صورت کامل رمزنگاری شده و در محیطی امن ذخیره می‌شوند. تنها گیرنده پیام قادر به خواندن آن خواهد بود.
- رمزنگاری پیشرفته: تمامی پیام‌ها با استفاده از کلیدهای خصوصی و رمزنگاری AES-GCM محافظت می‌شوند، به طوری که حتی اگر کسی به داده‌های ذخیره شده دسترسی پیدا کند، نمی‌تواند آنها را بخواند.
- استفاده آسان: با چند کلیک ساده می‌توانید مکالمات خود را آغاز کنید و از امنیت کامل ارتباطات خود مطمئن باشید.
- کلید امنیتی اختصاصی: هر کاربر دارای یک کلید امنیتی منحصر به فرد است که به حفظ امنیت مکالمات کمک می‌کند.

حریم خصوصی و امنیت:
- رمزنگاری دو لایه: پیام‌های شما قبل از ارسال به سرور، به وسیله یک کلید خصوصی که فقط شما و گیرنده آن را دارید، رمزنگاری می‌شوند. سپس با یک کلید امنیتی ثانویه که در محیط ایمن Cloudflare ذخیره شده است، مجدداً رمزنگاری می‌شوند.
- عدم ذخیره‌سازی اطلاعات حساس: نِکونیموس هیچ‌گونه اطلاعات حساس و شخصی شما را در سرورهای خود ذخیره نمی‌کند. تمامی داده‌ها تنها برای مدت زمان مورد نیاز جهت پردازش پیام‌ها نگهداری می‌شوند و سپس به صورت ایمن حذف می‌گردند.
- حفاظت از هویت: لینک‌های ناشناس تولید شده توسط ربات، هیچ‌گونه ارتباط مستقیمی با هویت واقعی شما ندارند. این به شما امکان می‌دهد تا بدون نگرانی از افشای هویت خود، پیام ارسال کنید.
- شفافیت و کنترل: شما در هر لحظه می‌توانید حساب کاربری خود را حذف کرده و تمامی داده‌های مربوط به آن را از سرورهای ما پاک کنید.

سیاست‌های حریم خصوصی:
- عدم اشتراک‌گذاری اطلاعات: نِکونیموس متعهد به عدم اشتراک‌گذاری اطلاعات کاربران با شخص ثالث می‌باشد. تمامی داده‌ها تنها برای ارائه خدمات ربات مورد استفاده قرار می‌گیرند.
- حذف داده‌ها: شما می‌توانید در هر زمان درخواست حذف حساب کاربری و تمامی داده‌های مرتبط با آن را ارسال کنید. این عملیات به صورت خودکار و بلافاصله انجام خواهد شد.
- گزارش‌دهی شفاف: تمامی اقدامات انجام شده توسط ربات، از جمله ثبت‌نام کاربران و ارسال پیام‌ها، به صورت امن در سیستم لاگ‌گذاری ذخیره می‌شود. این گزارش‌ها برای بهبود خدمات و اطمینان از رعایت حریم خصوصی مورد استفاده قرار می‌گیرند.

لینک بات : https://nekonymous.alizemani.ir/
`;

export const UnsupportedMessageTypeMessage = `
فرمت فایل پشتیبانی نمی‌شود!
لطفاً فرمت‌های پشتیبانی شده مانند متن، تصویر، ویدئو و ... را ارسال کنید.
`;

export const NEW_INBOX_MESSAGE = `
COUNT پیام ناشناس جدید دارید
/inbox
`;

export const EMPTY_INBOX_MESSAGE = `
پیام ناخوانده ندارید 
`;

export const YOUR_MESSAGE_SEEN_MESSAGE = `
پیام شما دیده شد!

`;

export const RATE_LIMIT_MESSAGE = `
کمی آهسته تر :)
`;
