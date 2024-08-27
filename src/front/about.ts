import { html } from "@worker-tools/html";

const AboutPageContent = html`
  <div class="max-w-4xl mx-auto p-4">
    <p class="text-lg leading-relaxed mb-4">
      نِکونیموس یک ربات قدرتمند و خصوصی برای ارسال پیام‌های ناشناس است. با این
      ربات می‌توانید بدون افشای هویت خود، به صورت کاملاً امن با دیگر کاربران
      ارتباط برقرار کنید. نِکونیموس با بهره‌گیری از تکنولوژی‌های پیشرفته و
      الگوریتم‌های رمزنگاری مدرن، امنیت کامل مکالمات شما را تضمین می‌کند.
    </p>

    <h2 class="text-2xl font-semibold mt-8 mb-4">چگونگی کارکرد ربات</h2>
    <p class="text-lg leading-relaxed mb-4">
      نِکونیموس به شما این امکان را می‌دهد که به صورت ناشناس پیام‌های خود را به
      دیگران ارسال کنید. هنگامی که شما از این ربات استفاده می‌کنید، یک لینک یکتا
      برای شما تولید می‌شود. این لینک را می‌توانید با دیگران به اشتراک بگذارید
      تا آن‌ها بتوانند به صورت ناشناس به شما پیام ارسال کنند.
    </p>
    <p class="text-lg leading-relaxed mb-4">
      در هر بار استفاده از ربات، یک شناسه یکتا (UUID) به شما اختصاص داده می‌شود.
      این شناسه‌ها به صورت تصادفی تولید می‌شوند و به هیچ وجه به هویت واقعی شما
      متصل نیستند. زمانی که کاربری از طریق لینک شما پیام ارسال می‌کند، پیام‌ها
      به صورت رمزنگاری شده برای شما ارسال می‌شوند. تنها شما قادر به خواندن این
      پیام‌ها هستید، چرا که کلیدهای رمزنگاری به صورت کاملاً امن و منحصر به فرد
      برای هر مکالمه تولید می‌شوند.
    </p>

    <h2 class="text-2xl font-semibold mt-8 mb-4">سیستم امنیتی ربات</h2>
    <p class="text-lg leading-relaxed mb-4">
      نِکونیموس از تکنیک‌های پیشرفته رمزنگاری برای حفظ امنیت داده‌ها استفاده
      می‌کند. هر مکالمه با یک کلید خصوصی منحصربه‌فرد رمزگذاری می‌شود که در
      سرورهای ما ذخیره نمی‌شود و تنها برای مدت زمان لازم جهت ارسال و دریافت
      پیام‌ها استفاده می‌شود. حتی اگر فردی به سرورهای ما دسترسی پیدا کند،
      نمی‌تواند پیام‌های شما را بخواند.
    </p>
    <p class="text-lg leading-relaxed mb-4">
      همچنین، یک مکانیسم امنیتی اضافه با استفاده از کلید APP_SECURE_KEY به منظور
      ترکیب با کلید خصوصی تولید شده در ربات، پیاده‌سازی شده است. این مکانیسم
      باعث می‌شود که حتی در صورت دسترسی به داده‌های ذخیره‌شده، هیچ‌گونه اطلاعات
      قابل استفاده‌ای بدون داشتن کلید APP_SECURE_KEY استخراج نشود.
    </p>

    <h2 class="text-2xl font-semibold mt-8 mb-4">زیرساخت فنی</h2>
    <p class="text-lg leading-relaxed mb-4">
      نِکونیموس بر روی پلتفرم Cloudflare Workers اجرا می‌شود، که یکی از
      سریع‌ترین و امن‌ترین پلتفرم‌های ابری موجود است. این پلتفرم به ما امکان
      می‌دهد تا ربات را با سرعت بالا و با دسترسی گسترده ارائه دهیم. Cloudflare
      Workers درخواست‌ها را در نزدیک‌ترین دیتاسنتر به کاربر پردازش می‌کند، که
      این امر منجر به بهبود عملکرد و کاهش تأخیر در پاسخگویی می‌شود.
    </p>
    <p class="text-lg leading-relaxed mb-4">
      داده‌های کاربر در Cloudflare R2 و KV Storage به صورت توزیع شده و رمزنگاری
      شده ذخیره می‌شوند. این سیستم به ما امکان می‌دهد تا داده‌ها را به صورت امن
      و با دسترسی بالا در سراسر جهان مدیریت کنیم، به طوری که دسترسی به آن‌ها
      تنها با استفاده از کلیدهای امنیتی ممکن است.
    </p>

    <h2 class="text-2xl font-semibold mt-8 mb-4">سیستم گزارش‌گیری (Logs)</h2>
    <p class="text-lg leading-relaxed mb-4">
      نِکونیموس از یک سیستم گزارش‌گیری پیشرفته برای پیگیری و ثبت فعالیت‌های
      مختلف ربات استفاده می‌کند. تمامی رویدادها مانند ایجاد کاربر جدید، ارسال
      پیام، آغاز مکالمه جدید، و خطاهای احتمالی به صورت لاگ در Cloudflare R2
      ذخیره می‌شوند. این گزارش‌ها می‌توانند برای تحلیل عملکرد ربات، بهبود
      سیستم‌ها، و تضمین امنیت مورد استفاده قرار گیرند.
    </p>
    <p class="text-lg leading-relaxed mb-4">
      با استفاده از این سیستم، می‌توانیم اطلاعات ارزشمندی از کاربران آنلاین،
      تعداد مکالمات فعال، و میزان استفاده از ربات در بازه‌های زمانی مختلف
      جمع‌آوری کنیم. این اطلاعات به صورت ناشناس و فقط برای بهبود سرویس‌ها مورد
      استفاده قرار می‌گیرند.
    </p>

    <h2 class="text-2xl font-semibold mt-8 mb-4">مکانیزم‌های امنیتی پیشرفته</h2>
    <p class="text-lg leading-relaxed mb-4">
      نِکونیموس از الگوریتم‌های رمزنگاری متقارن و نامتقارن استفاده می‌کند که یکی
      از امن‌ترین روش‌ها برای حفاظت از اطلاعات است. در هر مکالمه، یک کلید خصوصی
      برای رمزنگاری و رمزگشایی پیام‌ها تولید می‌شود. این کلیدها به هیچ وجه در
      سرورها ذخیره نمی‌شوند و فقط به صورت موقت برای پردازش پیام‌ها مورد استفاده
      قرار می‌گیرند.
    </p>
    <p class="text-lg leading-relaxed mb-4">
      همچنین، برای اطمینان از عدم دسترسی افراد غیرمجاز به پیام‌ها، از
      مکانیزم‌های احراز هویت چند مرحله‌ای استفاده می‌کنیم. این مکانیزم‌ها تضمین
      می‌کنند که تنها افراد مجاز قادر به ارسال و دریافت پیام‌ها باشند.
    </p>

    <h2 class="text-2xl font-semibold mt-8 mb-4">نحوه استفاده از ربات</h2>
    <p class="text-lg leading-relaxed mb-4">
      برای استفاده از نِکونیموس، کافی است لینک ناشناس خود را از طریق دستور
      "دریافت لینک" دریافت کرده و آن را با دیگران به اشتراک بگذارید. هنگامی که
      فردی از طریق این لینک به شما پیام ارسال می‌کند، شما یک اعلان دریافت خواهید
      کرد و می‌توانید به آن پاسخ دهید.
    </p>
    <p class="text-lg leading-relaxed mb-4">
      اگر می‌خواهید حریم خصوصی بیشتری داشته باشید، می‌توانید از دستور "حذف حساب"
      برای حذف کامل حساب کاربری خود و تمامی پیام‌های مرتبط استفاده کنید.
      نِکونیموس به شما این اطمینان را می‌دهد که تمامی مکالمات شما به صورت کاملاً
      امن و خصوصی باقی خواهند ماند.
    </p>
  </div>
`;

export default AboutPageContent;
