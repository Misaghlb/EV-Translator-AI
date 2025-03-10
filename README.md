# EV Translator AI

## فارسی

### توضیحات پروژه
این اکستنشن برای مرورگر کروم طراحی شده است که به کاربران توییتر اجازه می‌دهد توییت‌های به زبان‌های خارجی را به فارسی ترجمه کنند. همچنین امکان ترجمه متن انتخاب شده در هر وب‌سایتی را فراهم می‌کند. این ابزار با استفاده از API جمینای (Gemini) کار می‌کند و امکان ترجمه دقیق و سفارشی را فراهم می‌کند.

### ویژگی‌ها
- **ترجمه توییت‌ها**: با کلیک بر روی دکمه "ترجمه توییت" زیر توییت‌های غیرفارسی، متن توییت به زبان فارسی ترجمه می‌شود.
- **بازترجمه**: امکان دریافت ترجمه جدید با استفاده از دکمه "بازترجمه" در صورت نارضایتی از ترجمه اولیه.
- **ترجمه متن انتخابی**: با انتخاب هر متنی در هر وب‌سایت، دکمه ترجمه ظاهر می‌شود که با کلیک روی آن، متن انتخاب شده ترجمه می‌شود.
- **تشخیص خودکار زبان**: سیستم به صورت خودکار زبان متن را تشخیص داده و آن را به فارسی ترجمه می‌کند.
- **سازگاری با حالت تاریک**: رابط کاربری اکستنشن با حالت تاریک و روشن توییتر سازگار است.
- **دستور ترجمه سفارشی**: کاربران می‌توانند پرامپت مورد نظر خود را برای ترجمه وارد کنند تا مدل و لحن ترجمه مطابق با نیاز آن‌ها باشد.

### نحوه نصب
1. اکستنشن را از این صفحه دانلود کنید.
2. فایل دانلود شده را در یک فولدر قرار دهید.
3. در مرورگر کروم وارد صفحه اکستنشن ها شوید (از آدرس Menu > Extension > Manage Extensions)
4. در صفحه باز شده گزینه Load Unpacked را از منوی سمت چپ انتخاب و فولدر اکستنشن را انتخاب کنید.
5. به آدرس https://aistudio.google.com/app/apikey بروید و یک API Key رایگان از جمینای گوگل دریافت کنید.
6. به بخش تنظیمات اکستنشن بروید و API Key خود را در این بخش وارد کنید.
7. در بخش "دستور ترجمه"، پرامپت مورد نظر خود را وارد کنید یا از پرامپت پیش‌فرض استفاده نمایید.

### نحوه استفاده
- **ترجمه توییت‌ها**: پس از نصب اکستنشن، به توییتر بروید. زیر هر توییت غیرفارسی، دکمه "ترجمه توییت" ظاهر می‌شود. با کلیک بر روی این دکمه، متن توییت به فارسی ترجمه می‌شود. اگر از ترجمه راضی نیستید، می‌توانید روی دکمه "بازترجمه" کلیک کنید تا ترجمه جدیدی دریافت کنید.
- **ترجمه متن انتخابی**: در هر وب‌سایتی، متن مورد نظر خود را انتخاب کنید. دکمه "Translate" در نزدیکی متن انتخاب شده ظاهر می‌شود. با کلیک بر روی این دکمه، متن انتخاب شده به فارسی ترجمه می‌شود.

### تغییر زبان خروجی
یکی از قابلیت‌های مهم این افزونه، امکان تغییر زبان خروجی ترجمه است. به طور پیش‌فرض، متون به زبان فارسی ترجمه می‌شوند، اما شما می‌توانید با تغییر پرامپت، زبان مقصد را به هر زبان دیگری تغییر دهید.

### مشارکت
اگر به بهبود این پروژه علاقه‌مند هستید، می‌توانید از طریق Pull Request یا Issue مشارکت کنید.

---

## English

### Project Description
This Chrome extension allows Twitter users to translate non-Persian tweets into Persian. It also provides the ability to translate selected text on any website. The tool uses the Gemini API to provide accurate and customizable translations.

### Features
- **Tweet Translation**: Click the "ترجمه توییت" (Translate Tweet) button below non-Persian tweets to translate them into Persian.
- **Re-translation**: Get a new translation using the "بازترجمه" (Re-translate) button if you're not satisfied with the initial translation.
- **Selected Text Translation**: Select any text on any website and a translate button will appear, allowing you to translate the selected text.
- **Automatic Language Detection**: The system automatically detects the language of the text and translates it to Persian.
- **Dark Mode Compatibility**: The extension's UI adapts to Twitter's light and dark modes.
- **Custom Translation Prompt**: Users can enter their own prompt for translation to adjust the model and tone according to their needs.

### Installation
1. Download the extension from this page.
2. Place the downloaded file in a folder.
3. In Chrome, go to the extensions page (Menu > Extension > Manage Extensions).
4. Select "Load Unpacked" from the left menu and choose the extension folder.
5. Go to https://aistudio.google.com/app/apikey to get a free Gemini API Key from Google.
6. Go to the extension settings and enter your API Key.
7. In the "Translation Prompt" section, enter your desired prompt or use the default one.

### How to Use
- **Tweet Translation**: After installing the extension, go to Twitter. A "ترجمه توییت" button will appear below each non-Persian tweet. Click this button to translate the tweet into Persian. If you're not satisfied with the translation, click the "بازترجمه" button to get a new translation.
- **Selected Text Translation**: On any website, select the text you want to translate. A "Translate" button will appear near the selected text. Click this button to translate the selected text into Persian.

### Changing the Output Language
One of the key features of this extension is the ability to change the output language of translations. By default, texts are translated to Persian, but you can modify the prompt to change the target language to any language you prefer.

### Contribution
If you are interested in improving this project, you can contribute via Pull Request or Issue.
