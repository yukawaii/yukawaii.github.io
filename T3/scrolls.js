// ======================== СВИТКИ (СКРОЛЛЫ) ========================

// Тексты свитков с локализацией
const SCROLLS_TEXT = {
  1: {
    ru: 'Пространство не является пустотой. Оно подобно ткани, которая может искривляться под воздействием массы. Это искривление и есть то, что мы называем гравитацией. (Из теории относительности Эйнштейна)',
    en: 'Space is not a void. It is like a fabric that can be curved by mass. This curvature is what we call gravity. (From Einstein\'s theory of relativity)',
    tr: 'Uzay boşluk değildir. Kütle tarafından bükülebilen bir kumaş gibidir. Bu eğrilik, yerçekimi dediğimiz şeydir. (Einstein\'ın görelilik teorisinden)'
  },
  2: {
    ru: 'Геометрия учит нас, что кратчайший путь между двумя точками — прямая. Но в искривленном пространстве этот путь становится дугой. Так и в жизни: иногда кажущийся обходной путь оказывается самым прямым.',
    en: 'Geometry teaches us that the shortest path between two points is a straight line. But in curved space, this path becomes an arc. In life, the seemingly roundabout way is sometimes the most direct.',
    tr: 'Geometri bize iki nokta arasındaki en kısa yolun düz bir çizgi olduğunu öğretir. Ama eğri uzayda bu yol bir yay olur. Hayatta da bazen dolambaçlı görünen yol en doğrudan olanıdır.'
  },
  3: {
    ru: 'Вселенная состоит из бесконечного множества блоков — от кварков до галактик. Каждый блок держится на своих законах, но все они подчиняются единой гармонии. (Из трудов по астрофизике)',
    en: 'The universe consists of an infinite set of blocks — from quarks to galaxies. Each block follows its own laws, but all obey a single harmony. (From astrophysics works)',
    tr: 'Evren kuarklardan galaksilere kadar sonsuz sayıda bloktan oluşur. Her blok kendi yasalarına uyar, ama hepsi tek bir uyuma boyun eğer. (Astrofizik çalışmalarından)'
  },
  4: {
    ru: 'Архитектура — это застывшая музыка. Каждая колонна, каждая арфа — нота в симфонии пространства. Здание говорит с нами на языке пропорций и ритмов. (Из трактатов Витрувия)',
    en: 'Architecture is frozen music. Every column, every arch is a note in the symphony of space. A building speaks to us in the language of proportions and rhythms. (From Vitruvius\' treatises)',
    tr: 'Mimarlık donmuş müziktir. Her sütun, her kemer uzay senfonisinde bir notadır. Bir bina bizimle oranlar ve ritimler dilinde konuşur. (Vitruvius\'un incelemelerinden)'
  },
  5: {
    ru: 'Мы состоим из звездной пыли. Атомы нашего тела были рождены в недрах древних сверхновых. Мы — способ, которым космос познает сам себя. (Карл Саган)',
    en: 'We are made of star stuff. The atoms in our bodies were born in the hearts of ancient supernovae. We are the way the cosmos knows itself. (Carl Sagan)',
    tr: 'Biz yıldız tozundan yapıldık. Vücudumuzdaki atomlar eski süpernovaların kalbinde doğdu. Biz evrenin kendini tanıma yoluyuz. (Carl Sagan)'
  },
  6: {
    ru: 'Золотое сечение можно найти повсюду: в раковинах, в галактиках, в Парфеноне. Это число 1.618 — ключ к гармонии природы и искусства. (Из трудов Евклида и Фибоначчи)',
    en: 'The golden ratio can be found everywhere: in shells, in galaxies, in the Parthenon. This number 1.618 is the key to the harmony of nature and art. (From Euclid and Fibonacci)',
    tr: 'Altın oran her yerde bulunur: kabuklarda, galaksilerde, Parthenon\'da. Bu 1.618 sayısı doğanın ve sanatın uyumunun anahtarıdır. (Öklid ve Fibonacci\'den)'
  },
  7: {
    ru: 'Пространство и время — это не отдельные сущности, а единый континуум — пространство-время. Мы движемся в нем, как корабли в океане. (Из работ Минковского)',
    en: 'Space and time are not separate entities but a single continuum — spacetime. We move through it like ships in an ocean. (From Minkowski\'s works)',
    tr: 'Uzay ve zaman ayrı varlıklar değil, tek bir sürekliliktir — uzay-zaman. İçinde okyanustaki gemiler gibi hareket ederiz. (Minkowski\'nin çalışmalarından)'
  },
  8: {
    ru: 'Строительство пирамид учит нас, что великое создается из малого. Миллионы блоков, уложенных с точностью до миллиметра, — это символ человеческой воли и разума. (Из истории архитектуры)',
    en: 'Building pyramids teaches us that greatness is made from small things. Millions of blocks laid with millimeter precision — a symbol of human will and reason. (From architectural history)',
    tr: 'Piramit inşası bize büyüğün küçükten yapıldığını öğretir. Milimetrik hassasiyetle yerleştirilmiş milyonlarca blok — insan iradesi ve aklının sembolü. (Mimarlık tarihinden)'
  },
  9: {
    ru: 'Вселенная расширяется, и галактики разбегаются, как осколки после взрыва. Но между ними есть нити темной материи — невидимый каркас космоса. (Из современных астрофизических теорий)',
    en: 'The universe is expanding, and galaxies are fleeing like shards after an explosion. But between them are threads of dark matter — the invisible framework of space. (From modern astrophysics)',
    tr: 'Evren genişliyor ve galaksiler patlama sonrası parçalar gibi kaçışıyor. Ama aralarında karanlık madde iplikleri var — uzayın görünmez iskelesi. (Modern astrofizikten)'
  },
  10: {
    ru: 'Круг — самая совершенная фигура. Нет ни начала, ни конца. Так же вечен цикл звездной жизни: рождение, сияние, смерть и возрождение в новой звезде.',
    en: 'The circle is the most perfect figure. No beginning, no end. Eternal is the cycle of stellar life: birth, brilliance, death, and rebirth in a new star.',
    tr: 'Daire en mükemmel şekildir. Ne başlangıç ne son vardır. Yıldız yaşamının döngüsü de böyle sonsuzdur: doğum, parlaklık, ölüm ve yeni bir yıldızda yeniden doğuş.'
  },
  11: {
    ru: 'Математика — это язык, на котором написана книга природы. Галилей говорил, что без нее мы блуждаем в темном лабиринте. (Галилео Галилей)',
    en: 'Mathematics is the language in which the book of nature is written. Galileo said that without it, we wander in a dark labyrinth. (Galileo Galilei)',
    tr: 'Matematik, doğa kitabının yazıldığı dildir. Galileo, onsuz karanlık bir labirentte kaybolduğumuzu söyledi. (Galileo Galilei)'
  },
  12: {
    ru: 'Каждая галактика уникальна, как снежинка. Спиральные, эллиптические, неправильные — все они танцуют в бесконечном космическом балете. (Из каталогов Хаббла)',
    en: 'Every galaxy is unique, like a snowflake. Spiral, elliptical, irregular — all dance in an infinite cosmic ballet. (From Hubble\'s catalogs)',
    tr: 'Her galaksi bir kar tanesi gibi benzersizdir. Sarmal, eliptik, düzensiz — hepsi sonsuz bir kozmik balede dans eder. (Hubble kataloglarından)'
  },
  13: {
    ru: 'В архитектуре готических соборов мы видим устремленность ввысь. Каждый камень, каждая арка направлены к небу — к вечности. Это диалог человека с Богом через пространство.',
    en: 'In Gothic cathedrals, we see an upward aspiration. Every stone, every arch points to the sky — to eternity. This is a dialogue between man and God through space.',
    tr: 'Gotik katedrallerde yukarıya doğru bir özlem görürüz. Her taş, her kemer gökyüzüne — sonsuzluğa işaret eder. Bu, insanın Tanrı ile uzay aracılığıyla diyalogudur.'
  },
  14: {
    ru: 'Тессеракт — это куб в четырех измерениях. Мы не можем его увидеть, но можем представить. Так математика учит нас выходить за пределы видимого. (Из работ по высшей геометрии)',
    en: 'A tesseract is a cube in four dimensions. We cannot see it, but we can imagine it. Thus mathematics teaches us to go beyond the visible. (From higher geometry works)',
    tr: 'Tesserakt, dört boyutta bir küptür. Göremeyiz ama hayal edebiliriz. Matematik bize görünenin ötesine geçmeyi böyle öğretir. (Yüksek geometri çalışmalarından)'
  },
  15: {
    ru: 'Гармония сфер — это древняя идея о музыкальных пропорциях планет. Каждая планета издает свой тон, и вместе они создают музыку Вселенной. (Из учения Пифагора)',
    en: 'The harmony of the spheres is the ancient idea of the musical proportions of planets. Each planet produces its own tone, and together they create the music of the Universe. (From Pythagorean teachings)',
    tr: 'Kürelerin uyumu, gezegenlerin müzikal oranlarına dair eski bir fikirdir. Her gezegen kendi tonunu üretir ve birlikte Evrenin müziğini yaratırlar. (Pisagor öğretisinden)'
  },
  16: {
    ru: 'Черные дыры — это места, где пространство и время сворачиваются в бесконечность. За горизонтом событий нет ничего, кроме вечного падения. (Из работ Стивена Хокинга)',
    en: 'Black holes are places where space and time fold into infinity. Beyond the event horizon, there is nothing but eternal fall. (From Stephen Hawking\'s works)',
    tr: 'Kara delikler, uzay ve zamanın sonsuzluğa katlandığı yerlerdir. Olay ufkunun ötesinde sonsuz düşüşten başka bir şey yoktur. (Stephen Hawking\'in çalışmalarından)'
  },
  17: {
    ru: 'Прямоугольник — основа всей архитектуры. Дверь, окно, фасад — все это прямоугольники. Они дают нам ощущение стабильности и порядка. (Из классической архитектурной теории)',
    en: 'The rectangle is the basis of all architecture. Door, window, facade — all are rectangles. They give us a feeling of stability and order. (From classical architectural theory)',
    tr: 'Dikdörtgen, tüm mimarlığın temelidir. Kapı, pencere, cephe — hepsi dikdörtgendir. Bize istikrar ve düzen duygusu verirler. (Klasik mimarlık teorisinden)'
  },
  18: {
    ru: 'Мы живем в одной из рукавов галактики Млечный Путь. Наше Солнце — всего лишь одна из 200 миллиардов звезд. И все же мы часть бесконечного. (Из астрономических наблюдений)',
    en: 'We live in one of the arms of the Milky Way galaxy. Our Sun is just one of 200 billion stars. And yet we are part of the infinite. (From astronomical observations)',
    tr: 'Samanyolu galaksisinin kollarından birinde yaşıyoruz. Güneşimiz sadece 200 milyar yıldızdan biri. Ama yine de sonsuzun bir parçasıyız. (Astronomik gözlemlerden)'
  },
  19: {
    ru: 'Симметрия — это равновесие частей. Она есть в кристаллах, в молекулах, в Пантеоне. Симметрия — это обещание порядка в хаотичном мире. (Из работ по кристаллографии)',
    en: 'Symmetry is the balance of parts. It exists in crystals, in molecules, in the Pantheon. Symmetry is the promise of order in a chaotic world. (From crystallography works)',
    tr: 'Simetri, parçaların dengesidir. Kristallerde, moleküllerde, Panteon\'da vardır. Simetri, kaotik bir dünyada düzenin vaadidir. (Kristalografi çalışmalarından)'
  },
  20: {
    ru: 'Пространство подобно океану, в котором гравитационные волны расходятся кругами, как от брошенного камня. Их открытие доказало, что Вселенная говорит с нами на языке колебаний. (Из открытий LIGO)',
    en: 'Space is like an ocean where gravitational waves spread in circles, like from a thrown stone. Their discovery proved that the Universe speaks to us in the language of vibrations. (From LIGO discoveries)',
    tr: 'Uzay, yerçekimi dalgalarının atılan taş gibi daireler çizerek yayıldığı bir okyanus gibidir. Keşifleri, Evrenin bizimle titreşimler dilinde konuştuğunu kanıtladı. (LIGO keşiflerinden)'
  },
  21: {
    ru: 'Фракталы — это фигуры, которые бесконечно повторяют себя. Береговая линия, облако, брокколи — все это фракталы. Природа экономна: она повторяет один паттерн снова и снова. (Из работ Мандельброта)',
    en: 'Fractals are figures that repeat themselves infinitely. Coastline, cloud, broccoli — all are fractals. Nature is economical: it repeats one pattern over and over. (From Mandelbrot\'s works)',
    tr: 'Fraktallar, kendini sonsuza kadar tekrar eden şekillerdir. Kıyı şeridi, bulut, brokoli — hepsi fraktaldır. Doğa tutumludur: bir deseni tekrar tekrar kullanır. (Mandelbrot\'un çalışmalarından)'
  },
  22: {
    ru: 'Вселенная не просто больше, чем мы думаем. Она больше, чем мы можем думать. Наш разум ограничен, но он способен осознать свою ограниченность. (Из астрофизических эссе)',
    en: 'The universe is not just bigger than we think. It is bigger than we can think. Our mind is limited, but capable of recognizing its own limits. (From astrophysical essays)',
    tr: 'Evren sadece düşündüğümüzden daha büyük değil. Düşünebileceğimizden daha büyük. Zihnimiz sınırlıdır ama kendi sınırlılığını fark edebilir. (Astrofizik denemelerden)'
  },
  23: {
    ru: 'В каждом блоке, в каждом камне есть потенциал. Из простого куба можно создать храм. Из грубого материала — шедевр. Все зависит от руки мастера. (Из философии строительства)',
    en: 'In every block, in every stone, there is potential. From a simple cube, a temple can be created. From rough material — a masterpiece. It all depends on the master\'s hand. (From the philosophy of building)',
    tr: 'Her blokta, her taşta potansiyel vardır. Basit bir küpten bir tapınak yaratılabilir. Ham malzemeden — bir başyapıt. Hepsi ustanın eline bağlıdır. (İnşaat felsefesinden)'
  },
  24: {
    ru: 'Свет имеет двойную природу: он и волна, и частица. Так и пространство: оно и непрерывно, и дискретно. Все в этом мире имеет две стороны. (Из квантовой физики)',
    en: 'Light has a dual nature: it is both a wave and a particle. So is space: it is both continuous and discrete. Everything in this world has two sides. (From quantum physics)',
    tr: 'Işığın ikili bir doğası vardır: hem dalga hem parçacıktır. Uzay da öyle: hem sürekli hem kesiklidir. Bu dünyada her şeyin iki yüzü vardır. (Kuantum fiziğinden)'
  },
  25: {
    ru: 'Пантеон в Риме — это чудо инженерии. Его купол — идеальная полусфера, и до сих пор никто не превзошел его пропорции. Это диалог человека с космосом через геометрию.',
    en: 'The Pantheon in Rome is a marvel of engineering. Its dome is a perfect hemisphere, and no one has yet surpassed its proportions. This is a dialogue of man with the cosmos through geometry.',
    tr: 'Roma\'daki Panteon, mühendislik harikasıdır. Kubbesi mükemmel bir yarım küredir ve henüz kimse oranlarını geçememiştir. Bu, insanın geometri aracılığıyla kozmosla diyalogudur.'
  },
  26: {
    ru: 'Квазары — это самые яркие объекты во Вселенной. В их центре — сверхмассивные черные дыры, пожирающие материю. Свет от них идет к нам миллиарды лет. (Из астрономии)',
    en: 'Quasars are the brightest objects in the Universe. At their centers are supermassive black holes devouring matter. Their light has traveled to us for billions of years. (From astronomy)',
    tr: 'Kuazarlar Evrendeki en parlak nesnelerdir. Merkezlerinde maddeyi yutan süper kütleli kara delikler vardır. Işıkları bize milyarlarca yılda ulaşır. (Astronomiden)'
  },
  27: {
    ru: 'Треугольник — самая жесткая фигура. Он не деформируется под давлением. Так и человеческий дух должен быть подобен треугольнику: стойким и несгибаемым. (Из инженерной механики)',
    en: 'The triangle is the most rigid figure. It does not deform under pressure. So should the human spirit be like a triangle: resilient and unyielding. (From engineering mechanics)',
    tr: 'Üçgen en sert şekildir. Baskı altında deforme olmaz. İnsan ruhu da üçgen gibi olmalı: dayanıklı ve boyun eğmez. (Mühendislik mekaniğinden)'
  },
  28: {
    ru: 'Спиральные галактики — это космические водовороты. В их центре — древнее скопление звезд, а рукава рождают новые светила. Это вечный круговорот жизни и смерти. (Из галактической астрономии)',
    en: 'Spiral galaxies are cosmic whirlpools. At their center is an ancient cluster of stars, and the arms give birth to new luminaries. This is an eternal cycle of life and death. (From galactic astronomy)',
    tr: 'Sarmal galaksiler kozmik girdaplardır. Merkezlerinde eski bir yıldız kümesi vardır ve kollar yeni yıldızlar doğurur. Bu, yaşam ve ölümün sonsuz döngüsüdür. (Galaktik astronomiden)'
  },
  29: {
    ru: 'Витрувий учил, что архитектура должна иметь три качества: прочность, полезность и красоту. Без любого из них здание несовершенно. (Витрувий)',
    en: 'Vitruvius taught that architecture must have three qualities: durability, utility, and beauty. Without any one, the building is imperfect. (Vitruvius)',
    tr: 'Vitruvius, mimarlığın üç niteliği olması gerektiğini öğretti: sağlamlık, kullanışlılık ve güzellik. Bunlardan biri eksikse bina kusurludur. (Vitruvius)'
  },
  30: {
    ru: 'Планеты движутся по эллиптическим орбитам. Кеплер открыл это, изучая данные Тихо Браге. Эллипс — это не круг, но он тоже совершенен в своей гармонии. (Из законов Кеплера)',
    en: 'Planets move in elliptical orbits. Kepler discovered this by studying Tycho Brahe\'s data. The ellipse is not a circle, but it is also perfect in its harmony. (From Kepler\'s laws)',
    tr: 'Gezegenler eliptik yörüngelerde hareket eder. Kepler bunu Tycho Brahe\'nin verilerini inceleyerek keşfetti. Elips daire değildir ama kendi uyumunda da mükemmeldir. (Kepler yasalarından)'
  },
  31: {
    ru: 'Каждая стена, каждый угол — это геометрия, ставшая плотью. Мы строим не просто здания — мы строим наше понимание порядка. (Из архитектурной философии)',
    en: 'Every wall, every corner is geometry made flesh. We build not just buildings — we build our understanding of order. (From architectural philosophy)',
    tr: 'Her duvar, her köşe, ete kemiğe bürünmüş geometridir. Sadece binalar değil — düzen anlayışımızı inşa ederiz. (Mimarlık felsefesinden)'
  },
  32: {
    ru: 'Темная энергия — это сила, которая разрывает Вселенную. Она заставляет галактики разбегаться все быстрее. Мы не знаем, что это, но знаем, что она существует. (Из космологии)',
    en: 'Dark energy is the force that tears the Universe apart. It makes galaxies accelerate away from each other. We don\'t know what it is, but we know it exists. (From cosmology)',
    tr: 'Karanlık enerji, Evreni parçalayan kuvvettir. Galaksilerin birbirinden hızla uzaklaşmasına neden olur. Ne olduğunu bilmiyoruz ama var olduğunu biliyoruz. (Kozmolojiden)'
  },
  33: {
    ru: 'Додекаэдр — это платоново тело из двенадцати пятиугольников. Пифагорейцы считали его формой Вселенной. В нем есть тайна, которую мы до сих пор не разгадали. (Из трудов Платона)',
    en: 'The dodecahedron is a Platonic solid made of twelve pentagons. The Pythagoreans considered it the shape of the Universe. It holds a mystery we have yet to solve. (From Plato\'s works)',
    tr: 'Dodekahedron, on iki beşgenden oluşan bir Platonik cisimdir. Pisagorcular onu Evrenin şekli olarak görüyordu. Hala çözemediğimiz bir sırrı vardır. (Platon\'un çalışmalarından)'
  },
  34: {
    ru: 'Пространство пронизано нитями космических струн — одномерных дефектов. Если они существуют, они могут иметь колоссальную плотность и влиять на форму Вселенной. (Из теории струн)',
    en: 'Space is threaded with cosmic strings — one-dimensional defects. If they exist, they could have colossal density and affect the shape of the Universe. (From string theory)',
    tr: 'Uzay kozmik ipliklerle örülmüştür — tek boyutlu kusurlar. Varolarsa, devasa yoğunluğa sahip olabilir ve Evrenin şeklini etkileyebilirler. (Sicim teorisinden)'
  },
  35: {
    ru: 'Пропорции человеческого тела — это отражение космического порядка. Леонардо да Винчи изобразил это в своем Витрувианском человеке. Мы — мера всех вещей. (Леонардо да Винчи)',
    en: 'The proportions of the human body are a reflection of cosmic order. Leonardo da Vinci depicted this in his Vitruvian Man. We are the measure of all things. (Leonardo da Vinci)',
    tr: 'İnsan vücudunun oranları kozmik düzenin bir yansımasıdır. Leonardo da Vinci bunu Vitruvius Adamı\'nda tasvir etti. Her şeyin ölçüsüyüz. (Leonardo da Vinci)'
  },
  36: {
    ru: 'Вселенная расширяется не в пространстве, а вместе с пространством. Ткань космоса растягивается, как резина. И мы растягиваемся вместе с ней, не замечая этого. (Из космологических моделей)',
    en: 'The Universe expands not into space, but together with space. The fabric of space stretches like rubber. And we stretch with it, without noticing. (From cosmological models)',
    tr: 'Evren uzaya değil, uzayla birlikte genişler. Uzayın dokusu lastik gibi gerilir. Ve biz de fark etmeden onunla birlikte geriliriz. (Kozmolojik modellerden)'
  },
  37: {
    ru: 'В каждом здании есть скрытая геометрия. Архитектор видит ее невидимыми глазами. Он чувствует, как линии пересекаются в пространстве, создавая гармонию. (Из трактатов о пропорциях)',
    en: 'In every building there is a hidden geometry. The architect sees it with invisible eyes. He feels how lines intersect in space, creating harmony. (From treatises on proportions)',
    tr: 'Her binada gizli bir geometri vardır. Mimar onu görünmez gözlerle görür. Uzayda çizgilerin nasıl kesişip uyum yarattığını hisseder. (Oranlar üzerine incelemelerden)'
  },
  38: {
    ru: 'Звезды рождаются в туманностях — гигантских облаках газа и пыли. Гравитация сжимает их, и зажигается термоядерный огонь. Так начинается жизнь светила. (Из астрофизики)',
    en: 'Stars are born in nebulae — giant clouds of gas and dust. Gravity compresses them, and thermonuclear fire ignites. Thus begins the life of a star. (From astrophysics)',
    tr: 'Yıldızlar bulutsularda doğar — devasa gaz ve toz bulutlarında. Kütleçekim onları sıkıştırır ve termonükleer ateş yanar. Bir yıldızın yaşamı böyle başlar. (Astrofizikten)'
  },
  39: {
    ru: 'Сфера — это не просто шар. Это бесконечность точек, равноудаленных от центра. Она символ совершенства и полноты. Вселенная также может быть сферической. (Из геометрии Римана)',
    en: 'A sphere is not just a ball. It is an infinity of points equidistant from the center. It is a symbol of perfection and completeness. The Universe could also be spherical. (From Riemannian geometry)',
    tr: 'Küre sadece bir top değildir. Merkezden eşit uzaklıktaki sonsuz noktadır. Mükemmellik ve bütünlük sembolüdür. Evren de küresel olabilir. (Riemann geometrisinden)'
  },
  40: {
    ru: 'Математика — это поэзия логики. В ней есть своя красота, своя эстетика. Уравнения могут быть такими же прекрасными, как сонеты Шекспира. (Из эссе по математике)',
    en: 'Mathematics is the poetry of logic. It has its own beauty, its own aesthetics. Equations can be as beautiful as Shakespeare\'s sonnets. (From essays on mathematics)',
    tr: 'Matematik, mantığın şiiridir. Kendi güzelliği, kendi estetiği vardır. Denklemler Shakespeare\'in sonekleri kadar güzel olabilir. (Matematik üzerine denemelerden)'
  },
  41: {
    ru: 'Галактики сталкиваются и сливаются, как огромные водовороты. Через миллиарды лет наш Млечный Путь столкнется с Андромедой. Так рождаются новые миры. (Из астрономии)',
    en: 'Galaxies collide and merge like giant whirlpools. In billions of years, our Milky Way will collide with Andromeda. Thus new worlds are born. (From astronomy)',
    tr: 'Galaksiler devasa girdaplar gibi çarpışır ve birleşir. Milyarlarca yıl sonra Samanyolu\'muz Andromeda ile çarpışacak. Yeni dünyalar böyle doğar. (Astronomiden)'
  },
  42: {
    ru: 'Параллельные линии никогда не пересекаются — в евклидовой геометрии. Но в сферической они сходятся на полюсах. Так и истина зависит от системы отсчета. (Из неевклидовой геометрии)',
    en: 'Parallel lines never intersect — in Euclidean geometry. But in spherical geometry, they converge at the poles. So truth depends on the frame of reference. (From non-Euclidean geometry)',
    tr: 'Paralel çizgiler asla kesişmez — Öklid geometrisinde. Ama küresel geometride kutuplarda birleşirler. Hakikat de referans sistemine bağlıdır. (Öklid dışı geometriden)'
  },
  43: {
    ru: 'Архитекторы древности знали секрет: свет должен проникать в здание под определенным углом. Это создает игру теней, которая оживляет пространство. (Из древних трактатов)',
    en: 'Ancient architects knew the secret: light must enter a building at a certain angle. This creates a play of shadows that animates space. (From ancient treatises)',
    tr: 'Antik mimarlar sırrı biliyordu: ışık binaya belirli bir açıdan girmeli. Bu, uzayı canlandıran bir gölge oyunu yaratır. (Antik incelemelerden)'
  },
  44: {
    ru: 'Вселенная полна экзопланет — миров, похожих на наш. Некоторые из них могут быть обитаемы. Мы не одни — мы просто еще не нашли других. (Из экзопланетной астрономии)',
    en: 'The Universe is full of exoplanets — worlds like ours. Some may be habitable. We are not alone — we just haven\'t found the others yet. (From exoplanetary astronomy)',
    tr: 'Evren dış gezegenlerle doludur — bizimkine benzer dünyalar. Bazıları yaşanabilir olabilir. Yalnız değiliz — diğerlerini henüz bulamadık. (Ötegezegen astronomisinden)'
  },
  45: {
    ru: 'Пирамида — это не просто гробница. Это математическая модель Вселенной. Ее пропорции отражают соотношение окружности и радиуса. (Из египтологии и геометрии)',
    en: 'The pyramid is not just a tomb. It is a mathematical model of the Universe. Its proportions reflect the ratio of circumference to radius. (From Egyptology and geometry)',
    tr: 'Piramit sadece bir mezar değildir. Evrenin matematiksel bir modelidir. Oranları çevrenin yarıçapa oranını yansıtır. (Mısırbilim ve geometriden)'
  },
  46: {
    ru: 'Время течет с разной скоростью. Чем ближе к черной дыре, тем медленнее идет время. Для космонавта у горизонта событий мгновение — это вечность для нас. (Из теории относительности)',
    en: 'Time flows at different speeds. The closer to a black hole, the slower time passes. For an astronaut at the event horizon, a moment is an eternity for us. (From relativity theory)',
    tr: 'Zaman farklı hızlarda akar. Kara deliğe ne kadar yakınsa, zaman o kadar yavaş akar. Olay ufkundaki bir astronot için bir an, bizim için sonsuzluktur. (Görelilik teorisinden)'
  },
  47: {
    ru: 'Пятиугольник — это символ жизни, так как он встречается в цветах и плодах. Пифагорейцы называли его пентаграммой и считали знаком здоровья. (Из истории математики)',
    en: 'The pentagon is a symbol of life, as it appears in flowers and fruits. The Pythagoreans called it a pentagram and considered it a sign of health. (From the history of mathematics)',
    tr: 'Beşgen, yaşamın sembolüdür çünkü çiçeklerde ve meyvelerde görülür. Pisagorcular ona pentagram adını verdi ve sağlığın işareti saydı. (Matematik tarihinden)'
  },
  48: {
    ru: 'Пространство не молчит. Оно наполнено реликтовым излучением — эхом Большого взрыва. Это древнейший свет, который мы можем наблюдать. (Из космологии)',
    en: 'Space is not silent. It is filled with cosmic microwave background radiation — the echo of the Big Bang. This is the oldest light we can observe. (From cosmology)',
    tr: 'Uzay sessiz değildir. Kozmik mikrodalga arka plan ışımasıyla — Büyük Patlama\'nın yankısıyla doludur. Bu gözlemleyebileceğimiz en eski ışıktır. (Kozmolojiden)'
  },
  49: {
    ru: 'Колонны греческих храмов не просто прямые. Они слегка утолщаются кверху, чтобы компенсировать оптическую иллюзию. Архитектура обманывает наш глаз, чтобы мы видели гармонию. (Из архитектуры Древней Греции)',
    en: 'The columns of Greek temples are not simply straight. They slightly thicken upwards to compensate for optical illusion. Architecture deceives our eye so we see harmony. (From Ancient Greek architecture)',
    tr: 'Yunan tapınaklarının sütunları sadece düz değildir. Optik yanılsamayı telafi etmek için yukarı doğru hafifçe kalınlaşırlar. Mimarlık, uyumu görmemiz için gözümüzü yanıltır. (Antik Yunan mimarisinden)'
  },
  50: {
    ru: 'Вселенная — это книга, которую мы читаем с помощью телескопов и уравнений. Каждая страница открывает нам новый закон, новый мир. И мы только в начале. (Из астрономии)',
    en: 'The Universe is a book we read with telescopes and equations. Each page reveals a new law, a new world. And we are only at the beginning. (From astronomy)',
    tr: 'Evren, teleskoplar ve denklemlerle okuduğumuz bir kitaptır. Her sayfa yeni bir yasa, yeni bir dünya sunar. Ve biz sadece başlangıçtayız. (Astronomiden)'
  },
  51: {
    ru: 'Куб — это символ стабильности и материальности. В нем шесть граней, двенадцать ребер, восемь вершин. Это основа всей трехмерной геометрии. (Из элементарной геометрии)',
    en: 'The cube is a symbol of stability and materiality. It has six faces, twelve edges, eight vertices. It is the basis of all three-dimensional geometry. (From elementary geometry)',
    tr: 'Küp, istikrarın ve maddeselliğin sembolüdür. Altı yüzü, on iki kenarı, sekiz köşesi vardır. Tüm üç boyutlu geometrinin temelidir. (Temel geometriden)'
  },
  52: {
    ru: 'В космосе нет верха и низа. Направление — это относительное понятие. Там, где мы видим хаос, космос видит порядок. Все зависит от точки зрения. (Из небесной механики)',
    en: 'In space, there is no up or down. Direction is a relative concept. Where we see chaos, the cosmos sees order. It all depends on your point of view. (From celestial mechanics)',
    tr: 'Uzayda yukarı ve aşağı yoktur. Yön göreceli bir kavramdır. Kaos gördüğümüz yerde, kozmos düzen görür. Hepsi bakış açısına bağlıdır. (Gök mekaniğinden)'
  },
  53: {
    ru: 'Ле Корбюзье говорил: "Дом — это машина для жилья". Но машина должна быть гармоничной. Его модулор — это система пропорций, основанная на человеческом теле. (Ле Корбюзье)',
    en: 'Le Corbusier said: "A house is a machine for living." But the machine must be harmonious. His Modulor is a system of proportions based on the human body. (Le Corbusier)',
    tr: 'Le Corbusier: "Ev, yaşamak için bir makinedir" dedi. Ama makine uyumlu olmalı. Modülörü, insan vücuduna dayanan bir oran sistemidir. (Le Corbusier)'
  },
  54: {
    ru: 'Пульсары — это нейтронные звезды, которые вращаются с невероятной скоростью. Они посылают нам радиосигналы, как космические маяки. Их ритм точен, как атомные часы. (Из астрофизики)',
    en: 'Pulsars are neutron stars that spin at incredible speeds. They send us radio signals like cosmic lighthouses. Their rhythm is as precise as atomic clocks. (From astrophysics)',
    tr: 'Pulsarlar, inanılmaz hızlarda dönen nötron yıldızlarıdır. Kozmik deniz fenerleri gibi bize radyo sinyalleri gönderirler. Ritimleri atom saatleri kadar hassastır. (Astrofizikten)'
  },
  55: {
    ru: 'Пространство можно искривить настолько, что оно замкнется само на себя. Это червоточины — теоретические тоннели между разными точками пространства-времени. (Из теории червоточин)',
    en: 'Space can be curved so much that it closes in on itself. These are wormholes — theoretical tunnels between different points of spacetime. (From wormhole theory)',
    tr: 'Uzay kendi üzerine kapanacak kadar bükülebilir. Bunlar solucan delikleri — uzay-zamanın farklı noktaları arasındaki teorik tünellerdir. (Solucan deliği teorisinden)'
  },
  56: {
    ru: 'Гармония в архитектуре — это не только красота, но и функция. Здание должно служить человеку, а не подавлять его. Истинная архитектура — это диалог. (Из современной архитектурной теории)',
    en: 'Harmony in architecture is not just beauty, but also function. A building should serve man, not overwhelm him. True architecture is a dialogue. (From modern architectural theory)',
    tr: 'Mimarlıkta uyum sadece güzellik değil, aynı zamanda işlevdir. Bina insana hizmet etmeli, ezmemeli. Gerçek mimarlık bir diyalogdur. (Modern mimarlık teorisinden)'
  },
  57: {
    ru: 'Млечный Путь — это река из звезд. В ней есть водовороты из газа и пыли, где рождаются новые солнца. Мы живем на берегу этой звездной реки. (Из астрономических наблюдений)',
    en: 'The Milky Way is a river of stars. It has whirlpools of gas and dust where new suns are born. We live on the bank of this star river. (From astronomical observations)',
    tr: 'Samanyolu bir yıldız nehridir. Yeni güneşlerin doğduğu gaz ve toz girdapları vardır. Bu yıldız nehrinin kıyısında yaşıyoruz. (Astronomik gözlemlerden)'
  },
  58: {
    ru: 'Шестиугольник — это фигура, которая идеально заполняет плоскость. Пчелы строят соты именно в этой форме. Это математика, воплощенная в природе. (Из геометрии)',
    en: 'The hexagon is a figure that perfectly tiles the plane. Bees build their honeycombs in this exact shape. This is mathematics embodied in nature. (From geometry)',
    tr: 'Altıgen, düzlemi mükemmel şekilde kaplayan bir şekildir. Arılar peteklerini tam bu formda inşa eder. Bu, doğada somutlaşmış matematiktir. (Geometriden)'
  },
  59: {
    ru: 'Мы не можем видеть темную материю, но видим ее гравитационное влияние. Она удерживает галактики от разлетания. Это невидимый клей Вселенной. (Из астрофизики)',
    en: 'We cannot see dark matter, but we see its gravitational influence. It keeps galaxies from flying apart. It is the invisible glue of the Universe. (From astrophysics)',
    tr: 'Karanlık maddeyi göremeyiz ama kütleçekimsel etkisini görürüz. Galaksileri dağılmaktan alıkoyar. Evrenin görünmez yapıştırıcısıdır. (Astrofizikten)'
  },
  60: {
    ru: 'Кафедральные соборы строили по принципу "светящейся стены". Витражи превращали солнечный свет в цветной дождь, делая пространство божественным. (Из истории готической архитектуры)',
    en: 'Cathedrals were built on the principle of the "illuminated wall". Stained glass turned sunlight into a colorful rain, making space divine. (From Gothic architecture history)',
    tr: 'Katedraller "aydınlatılmış duvar" ilkesiyle inşa edildi. Vitraylar güneş ışığını renkli bir yağmura dönüştürerek alanı ilahi kıldı. (Gotik mimarlık tarihinden)'
  },
  61: {
    ru: 'Вселенная имеет форму, но мы не можем ее увидеть целиком. Мы как рыбы, которые пытаются понять форму океана. Но математика дает нам карту. (Из космологии)',
    en: 'The Universe has a shape, but we cannot see it whole. We are like fish trying to understand the shape of the ocean. But mathematics gives us a map. (From cosmology)',
    tr: 'Evrenin bir şekli var ama onu bütün olarak göremeyiz. Okyanusun şeklini anlamaya çalışan balıklar gibiyiz. Ama matematik bize bir harita verir. (Kozmolojiden)'
  },
  62: {
    ru: 'Архитектура барокко — это кривые линии, динамика, движение. Пространство там пульсирует, оно живет. Каждая деталь создает иллюзию бесконечности. (Из истории искусств)',
    en: 'Baroque architecture is curved lines, dynamics, movement. Space pulses there, it lives. Every detail creates an illusion of infinity. (From art history)',
    tr: 'Barok mimarlık eğri çizgiler, dinamik, harekettir. Orada uzay nabız atar, yaşar. Her ayrıntı sonsuzluk yanılsaması yaratır. (Sanat tarihinden)'
  },
  63: {
    ru: 'Квантовая запутанность — это связь между частицами, которая не зависит от расстояния. Они влияют друг на друга мгновенно. Это загадка, которая ломает наше понимание пространства. (Из квантовой физики)',
    en: 'Quantum entanglement is a connection between particles that does not depend on distance. They affect each other instantaneously. This is a mystery that breaks our understanding of space. (From quantum physics)',
    tr: 'Kuantum dolanıklığı, mesafeye bağlı olmayan parçacıklar arası bir bağlantıdır. Birbirlerini anında etkilerler. Bu, uzay anlayışımızı kıran bir gizemdir. (Kuantum fiziğinden)'
  },
  64: {
    ru: 'Собор Святой Софии в Константинополе изменил историю архитектуры. Его купол казался парящим в воздухе благодаря системе полукуполов. Свет и пространство стали единым целым. (Из истории архитектуры)',
    en: 'The Hagia Sophia in Constantinople changed architectural history. Its dome seemed to float in the air thanks to the system of semi-domes. Light and space became one. (From architectural history)',
    tr: 'Konstantinopolis\'teki Ayasofya, mimarlık tarihini değiştirdi. Kubbe, yarım kubbeler sistemi sayesinde havada süzülüyor gibiydi. Işık ve uzay bir oldu. (Mimarlık tarihinden)'
  },
  65: {
    ru: 'Каждая частица — это и волна, и точка в пространстве. Мир на квантовом уровне — это танец вероятностей. Реальность возникает только когда мы смотрим. (Из квантовой механики)',
    en: 'Every particle is both a wave and a point in space. The world at the quantum level is a dance of probabilities. Reality exists only when we look. (From quantum mechanics)',
    tr: 'Her parçacık hem dalga hem uzayda bir noktadır. Kuantum seviyesinde dünya bir olasılıklar dansıdır. Gerçeklik sadece baktığımızda var olur. (Kuantum mekaniğinden)'
  },
  66: {
    ru: 'Мост — это не просто сооружение. Это символ связи между мирами. Архитектор должен найти точку опоры, чтобы соединить берега. (Из инженерной философии)',
    en: 'A bridge is not just a structure. It is a symbol of connection between worlds. The architect must find a foothold to connect the banks. (From engineering philosophy)',
    tr: 'Köprü sadece bir yapı değildir. Dünyalar arasındaki bağlantının sembolüdür. Mimar, kıyıları birleştirmek için bir dayanak bulmalıdır. (Mühendislik felsefesinden)'
  },
  67: {
    ru: 'Космос — это не только звезды, но и пустота между ними. Эта пустота не мертва — она живет своими законами. В ней рождается новое. (Из астрономии)',
    en: 'Space is not just stars, but the void between them. This void is not dead — it lives by its own laws. In it, something new is born. (From astronomy)',
    tr: 'Kozmos sadece yıldızlar değil, aralarındaki boşluktur. Bu boşluk ölü değil — kendi yasalarıyla yaşar. İçinde yeni bir şey doğar. (Astronomiden)'
  },
  68: {
    ru: 'Форма здания определяет, как люди будут в нем чувствовать себя. Высокие потолки дают свободу, низкие — уют. Архитектура создает настроение. (Из психологии архитектуры)',
    en: 'The shape of a building determines how people will feel in it. High ceilings give freedom, low ones give coziness. Architecture creates mood. (From the psychology of architecture)',
    tr: 'Bir binanın şekli, insanların içinde nasıl hissedeceğini belirler. Yüksek tavanlar özgürlük verir, alçak olanlar rahatlık. Mimarlık ruh hali yaratır. (Mimarlık psikolojisinden)'
  },
  69: {
    ru: 'Гравитационные линзы — это явление, когда свет искривляется под действием массы. Галактики становятся увеличительными стеклами для дальних объектов. Так мы видим далекое прошлое. (Из астрофизики)',
    en: 'Gravitational lenses are a phenomenon where light is bent by mass. Galaxies act as magnifying glasses for distant objects. This way we see the distant past. (From astrophysics)',
    tr: 'Kütleçekimsel mercekler, ışığın kütle tarafından büküldüğü bir olgudur. Galaksiler, uzak nesneler için büyüteç görevi görür. Bu sayede uzak geçmişi görürüz. (Astrofizikten)'
  },
  70: {
    ru: 'Парфенон построен так, чтобы его колонны казались идеально прямыми. Но на самом деле они имеют изгибы. Это оптическая иллюзия во имя гармонии. (Из архитектуры Древней Греции)',
    en: 'The Parthenon is built so that its columns appear perfectly straight. But in fact, they are curved. This is an optical illusion for the sake of harmony. (From Ancient Greek architecture)',
    tr: 'Parthenon, sütunları mükemmel düz görünecek şekilde inşa edilmiştir. Ama aslında kavislidir. Bu, uyum adına optik bir yanılsamadır. (Antik Yunan mimarisinden)'
  },
  71: {
    ru: 'Вселенная, возможно, бесконечна. Или, возможно, она конечна, но без края. Подобно поверхности сферы, у которой нет границ. Мы никогда не достигнем ее предела. (Из космологических гипотез)',
    en: 'The Universe may be infinite. Or perhaps finite but without an edge. Like the surface of a sphere, which has no boundaries. We will never reach its limit. (From cosmological hypotheses)',
    tr: 'Evren sonsuz olabilir. Ya da belki sonsuz ama sınırsız. Sınırı olmayan bir kürenin yüzeyi gibi. Sınırına asla ulaşamayacağız. (Kozmolojik hipotezlerden)'
  },
  72: {
    ru: 'Архитектура должна быть экологичной. Здание не должно вредить природе, а должно вписываться в нее. Это новый вызов для современных зодчих. (Из современной архитектуры)',
    en: 'Architecture must be ecological. A building should not harm nature, but fit into it. This is the new challenge for modern architects. (From modern architecture)',
    tr: 'Mimarlık ekolojik olmalı. Bina doğaya zarar vermemeli, içine uyum sağlamalı. Bu, modern mimarlar için yeni bir meydan okuma. (Modern mimarlıktan)'
  },
  73: {
    ru: 'В центре каждой галактики находится сверхмассивная черная дыра. Она удерживает звезды в орбитальном танце. Это сердце галактики, которое питает ее энергией. (Из астрономии)',
    en: 'At the center of every galaxy is a supermassive black hole. It keeps the stars in an orbital dance. It is the heart of the galaxy, fueling it with energy. (From astronomy)',
    tr: 'Her galaksinin merkezinde süper kütleli bir kara delik vardır. Yıldızları yörünge dansında tutar. Galaksinin kalbidir, onu enerjiyle besler. (Astronomiden)'
  },
  74: {
    ru: 'Тетраэдр — это простейший многогранник. У него четыре грани, четыре вершины. Это основа всех структур в химии и кристаллографии. (Из геометрии)',
    en: 'The tetrahedron is the simplest polyhedron. It has four faces, four vertices. It is the basis of all structures in chemistry and crystallography. (From geometry)',
    tr: 'Tetrahedron en basit çokyüzlüdür. Dört yüzü, dört köşesi vardır. Kimya ve kristalografideki tüm yapıların temelidir. (Geometriden)'
  },
  75: {
    ru: 'Пространство — это не сцена, а актер. Оно взаимодействует со всем, что в нем находится. Материя искривляет пространство, пространство диктует материи путь. (Из теории относительности)',
    en: 'Space is not a stage, but an actor. It interacts with everything in it. Matter curves space, space dictates the path to matter. (From relativity theory)',
    tr: 'Uzay bir sahne değil, bir aktördür. İçindeki her şeyle etkileşime girer. Madde uzayı büker, uzay maddeye yolu dikte eder. (Görelilik teorisinden)'
  },
  76: {
    ru: 'В исламской архитектуре узоры бесконечны. Они повторяются, создавая иллюзию вечности. Каждый узор — это математическая прогрессия, ведущая к Богу. (Из истории исламского искусства)',
    en: 'In Islamic architecture, patterns are infinite. They repeat, creating an illusion of eternity. Each pattern is a mathematical progression leading to God. (From Islamic art history)',
    tr: 'İslam mimarisinde desenler sonsuzdur. Tekrar ederek sonsuzluk yanılsaması yaratırlar. Her desen Tanrı\'ya giden matematiksel bir ilerlemedir. (İslam sanatı tarihinden)'
  },
  77: {
    ru: 'Вселенная — это гигантский компьютер. Законы физики — это программа, а частицы — биты. Может быть, мы живем в симуляции? Этот вопрос волнует умы. (Из философии космоса)',
    en: 'The Universe is a giant computer. The laws of physics are the program, and particles are the bits. Maybe we live in a simulation? This question haunts minds. (From the philosophy of space)',
    tr: 'Evren dev bir bilgisayardır. Fizik yasaları program, parçacıklar ise bitlerdir. Belki bir simülasyonda yaşıyoruz? Bu soru zihinleri meşgul ediyor. (Uzay felsefesinden)'
  },
  78: {
    ru: 'Гармония возможна только через контраст. Свет без тьмы не дает глубины. В архитектуре это игра света и тени, которая оживляет объемы. (Из эстетики)',
    en: 'Harmony is possible only through contrast. Light without darkness does not give depth. In architecture, this is the play of light and shadow that brings volumes to life. (From aesthetics)',
    tr: 'Uyum ancak zıtlıkla mümkündür. Karanlıksız ışık derinlik vermez. Mimarlıkta bu, hacimleri canlandıran ışık ve gölge oyunudur. (Estetikten)'
  },
  79: {
    ru: 'Звезды умирают в грандиозных взрывах сверхновых. Их ядра сжимаются в нейтронные звезды или черные дыры. Так старое уступает место новому. (Из астрофизики)',
    en: 'Stars die in grand supernova explosions. Their cores collapse into neutron stars or black holes. Thus the old gives way to the new. (From astrophysics)',
    tr: 'Yıldızlar büyük süpernova patlamalarında ölür. Çekirdekleri nötron yıldızlarına veya kara deliklere çöker. Böylece eski, yeniye yer açar. (Astrofizikten)'
  },
  80: {
    ru: 'Конструктивизм в архитектуре — это поиск правды материала. Сталь, стекло, бетон — без украшений. Здание честно показывает свою структуру. (Из истории конструктивизма)',
    en: 'Constructivism in architecture is the search for the truth of material. Steel, glass, concrete — without decoration. The building honestly shows its structure. (From constructivist history)',
    tr: 'Mimarlıkta konstrüktivizm, malzemenin gerçeğini aramaktır. Çelik, cam, beton — süslemesiz. Bina yapısını dürüstçe gösterir. (Konstrüktivist tarihten)'
  },
  81: {
    ru: 'В космосе время и пространство переплетены так, что мы не можем разделить их. Мы живем в четырехмерном мире, но воспринимаем только три измерения. (Из теории пространства-времени)',
    en: 'In space, time and space are woven so tightly that we cannot separate them. We live in a four-dimensional world, but perceive only three dimensions. (From spacetime theory)',
    tr: 'Uzayda zaman ve uzay o kadar sıkı örülmüştür ki onları ayıramayız. Dört boyutlu bir dünyada yaşıyoruz ama sadece üç boyut algılıyoruz. (Uzay-zaman teorisinden)'
  },
  82: {
    ru: 'Пропорции — это душа архитектуры. Золотое сечение, квадрат, круг — это инструменты, которые превращают хаос в порядок. (Из архитектурных трактатов)',
    en: 'Proportions are the soul of architecture. The golden ratio, square, circle — these are tools that turn chaos into order. (From architectural treatises)',
    tr: 'Oranlar mimarlığın ruhudur. Altın oran, kare, daire — kaosu düzene çeviren araçlardır. (Mimarlık incelemelerinden)'
  },
  83: {
    ru: 'Туманность Ориона — это звездная колыбель. В ее облаках рождаются новые светила. Это место, где мы можем наблюдать творение прямо сейчас. (Из астрономических наблюдений)',
    en: 'The Orion Nebula is a stellar nursery. In its clouds, new luminaries are born. This is a place where we can witness creation right now. (From astronomical observations)',
    tr: 'Orion Bulutsusu bir yıldız fidanlığıdır. Bulutlarında yeni ışıklar doğar. Bu, şu anda yaratılışa tanıklık edebileceğimiz bir yerdir. (Astronomik gözlemlerden)'
  },
  84: {
    ru: 'Линия — это путь точки. Она может быть прямой или кривой, но всегда выражает движение. В архитектуре линия — это граница между пространством и формой. (Из геометрии)',
    en: 'A line is the path of a point. It can be straight or curved, but always expresses movement. In architecture, a line is the boundary between space and form. (From geometry)',
    tr: 'Çizgi, bir noktanın yoludur. Düz veya eğri olabilir ama her zaman hareketi ifade eder. Mimarlıkta çizgi, uzay ve form arasındaki sınırdır. (Geometriden)'
  },
  85: {
    ru: 'Вселенная не равномерна. В ней есть пустоты и сверхскопления, похожие на губку. Эта структура — следствие гравитационного коллапса в ранней Вселенной. (Из космологии)',
    en: 'The Universe is not uniform. It has voids and superclusters, like a sponge. This structure is a result of gravitational collapse in the early Universe. (From cosmology)',
    tr: 'Evren homojen değildir. Sünger gibi boşlukları ve süper kümeleri vardır. Bu yapı, erken Evrendeki kütleçekimsel çöküşün sonucudur. (Kozmolojiden)'
  },
  86: {
    ru: 'Японская архитектура учит нас ценить пустоту. Ма есть пустота между предметами, которая придает им смысл. Без пустоты нет формы. (Из философии дзен)',
    en: 'Japanese architecture teaches us to value emptiness. Ma is the void between objects that gives them meaning. Without emptiness, there is no form. (From Zen philosophy)',
    tr: 'Japon mimarisi bize boşluğa değer vermeyi öğretir. Ma, nesnelere anlam veren aralarındaki boşluktur. Boşluksuz form olmaz. (Zen felsefesinden)'
  },
  87: {
    ru: 'Гравитационные волны — это рябь на ткани пространства-времени. Они рождаются при столкновении черных дыр. Это музыка Вселенной, которая звучит в низких частотах. (Из физики)',
    en: 'Gravitational waves are ripples in the fabric of spacetime. They are born from colliding black holes. This is the music of the Universe, playing in low frequencies. (From physics)',
    tr: 'Kütleçekim dalgaları, uzay-zaman dokusundaki dalgalanmalardır. Kara deliklerin çarpışmasından doğarlar. Bu, düşük frekanslarda çalan Evrenin müziğidir. (Fizikten)'
  },
  88: {
    ru: 'В архитектуре постмодернизма цитаты из прошлого смешиваются с настоящим. Здание говорит на многих языках одновременно. Это диалог времен. (Из истории архитектуры)',
    en: 'In postmodern architecture, quotes from the past mix with the present. The building speaks many languages at once. This is a dialogue of times. (From architectural history)',
    tr: 'Postmodern mimarlıkta geçmişten alıntılar günümüzle karışır. Bina aynı anda birçok dilde konuşur. Bu, zamanların diyalogudur. (Mimarlık tarihinden)'
  },
  89: {
    ru: 'Вселенная расширяется с ускорением. Это открытие потрясло астрономов. Темная энергия побеждает гравитацию. Будущее космоса — холод и пустота. (Из космологических открытий)',
    en: 'The Universe is expanding with acceleration. This discovery shocked astronomers. Dark energy is overcoming gravity. The future of space is cold and void. (From cosmological discoveries)',
    tr: 'Evren hızlanarak genişliyor. Bu keşif gökbilimcileri şok etti. Karanlık enerji kütleçekimini yeniyor. Uzayın geleceği soğuk ve boşluk. (Kozmolojik keşiflerden)'
  },
  90: {
    ru: 'Октаэдр — это восьмигранник, который встречается в кристаллах алмаза. Он символ твердости и чистоты. Алмаз — это углерод, сжатый до предела. (Из минералогии)',
    en: 'The octahedron is a polyhedron found in diamond crystals. It is a symbol of hardness and purity. Diamond is carbon compressed to the limit. (From mineralogy)',
    tr: 'Oktahedron, elmas kristallerinde bulunan bir çokyüzlüdür. Sertlik ve saflığın sembolüdür. Elmas, sınıra kadar sıkıştırılmış karbondur. (Mineralojiden)'
  },
  91: {
    ru: 'Пространство может иметь больше трех измерений. Теория струн предполагает десять. Мы не видим их, потому что они свернуты в микроскопические петли. (Из теории струн)',
    en: 'Space may have more than three dimensions. String theory suggests ten. We don\'t see them because they are curled into microscopic loops. (From string theory)',
    tr: 'Uzay üçten fazla boyuta sahip olabilir. Sicim teorisi on önerir. Onları göremeyiz çünkü mikroskobik ilmeklere sarılmışlardır. (Sicim teorisinden)'
  },
  92: {
    ru: 'Архитектура Древнего Рима подарила нам арку и бетон. Эти изобретения изменили мир. Без них не было бы ни Колизея, ни современных городов. (Из истории архитектуры)',
    en: 'Ancient Roman architecture gave us the arch and concrete. These inventions changed the world. Without them, there would be no Colosseum, no modern cities. (From architectural history)',
    tr: 'Antik Roma mimarlığı bize kemer ve betonu verdi. Bu icatlar dünyayı değiştirdi. Onlar olmadan ne Kolezyum ne de modern şehirler olurdu. (Mimarlık tarihinden)'
  },
  93: {
    ru: 'Метагалактика — это совокупность всех галактик, которые мы можем наблюдать. За ее пределами может быть бесконечность. Или другие вселенные. (Из астрономии)',
    en: 'The metagalaxy is the totality of all galaxies we can observe. Beyond it may be infinity. Or other universes. (From astronomy)',
    tr: 'Metagalaksi, gözlemleyebildiğimiz tüm galaksilerin toplamıdır. Ötesinde sonsuzluk olabilir. Veya başka evrenler. (Astronomiden)'
  },
  94: {
    ru: 'Геодезические линии — это кратчайшие пути в искривленном пространстве. Свет движется именно по ним. Так Вселенная показывает нам свой самый прямой путь. (Из геометрии Римана)',
    en: 'Geodesic lines are the shortest paths in curved space. Light travels exactly along them. Thus the Universe shows us its most direct path. (From Riemannian geometry)',
    tr: 'Jeodezik çizgiler, eğri uzaydaki en kısa yollardır. Işık tam olarak onlar boyunca hareket eder. Evren bize en doğrudan yolunu böyle gösterir. (Riemann geometrisinden)'
  },
  95: {
    ru: 'Башни-близнецы Петронас в Куала-Лумпуре — это мост между Востоком и Западом. Их форма основана на исламских геометрических узорах. Архитектура объединяет культуры. (Из современной архитектуры)',
    en: 'The Petronas Twin Towers in Kuala Lumpur are a bridge between East and West. Their shape is based on Islamic geometric patterns. Architecture unites cultures. (From modern architecture)',
    tr: 'Kuala Lumpur\'daki Petronas İkiz Kuleleri, Doğu ile Batı arasında bir köprüdür. Formları İslami geometrik desenlere dayanır. Mimarlık kültürleri birleştirir. (Modern mimarlıktan)'
  },
  96: {
    ru: 'В центре Вселенной нет никого. Каждая точка — это центр своей собственной сферы наблюдения. Мы всегда в центре своей вселенной. (Из космологических принципов)',
    en: 'There is no one at the center of the Universe. Every point is the center of its own sphere of observation. We are always at the center of our own universe. (From cosmological principles)',
    tr: 'Evrenin merkezinde kimse yoktur. Her nokta kendi gözlem küresinin merkezidir. Her zaman kendi evrenimizin merkezindeyiz. (Kozmolojik ilkelerden)'
  },
  97: {
    ru: 'Архитектура — это забота о будущем. Мы строим для поколений, которых не увидим. Камень, который мы кладем сегодня, будет хранить нашу память через века. (Из философии строительства)',
    en: 'Architecture is a care for the future. We build for generations we will not see. The stone we lay today will preserve our memory for centuries. (From the philosophy of building)',
    tr: 'Mimarlık geleceğe dair bir özenidir. Görmeyeceğimiz nesiller için inşa ederiz. Bugün koyduğumuz taş, yüzyıllar boyunca hatıramızı yaşatacak. (İnşaat felsefesinden)'
  },
  98: {
    ru: 'Звездное небо — это карта времени. Мы видим звезды не такими, какие они есть, а такими, какие они были. Чем дальше звезда, тем глубже прошлое. (Из астрономии)',
    en: 'The starry sky is a map of time. We see stars not as they are, but as they were. The farther the star, the deeper the past. (From astronomy)',
    tr: 'Yıldızlı gökyüzü bir zaman haritasıdır. Yıldızları oldukları gibi değil, geçmişte oldukları gibi görürüz. Yıldız ne kadar uzaksa, geçmiş o kadar derindir. (Astronomiden)'
  },
  99: {
    ru: 'Строительство Вавилонской башни — это миф о человеческой гордыне. Но он учит нас, что без общего языка, без гармонии, самое великое творение рушится. (Из мифологии)',
    en: 'The building of the Tower of Babel is a myth of human pride. But it teaches us that without a common language, without harmony, the greatest creation collapses. (From mythology)',
    tr: 'Babil Kulesi\'nin inşası, insan kibriyle ilgili bir mittir. Ama bize, ortak bir dil olmadan, uyum olmadan en büyük eserin çökeceğini öğretir. (Mitoloji)'
  },
  100: {
    ru: 'Пространство хранит тайны. Каждый атом, каждый фотон несет информацию о происхождении Вселенной. Мы только учимся читать эту книгу. (Из космологии)',
    en: 'Space holds secrets. Every atom, every photon carries information about the origin of the Universe. We are only learning to read this book. (From cosmology)',
    tr: 'Uzay sırlar saklar. Her atom, her foton Evrenin kökenine dair bilgi taşır. Bu kitabı okumayı sadece öğreniyoruz. (Kozmolojiden)'
  }
};



// Функция для получения текста свитка с учётом языка
function getScrollText(id) {
    let lang = window.gameLanguage || 'ru';
    
    // 🔥 МАППИНГ ЯЗЫКОВ
    // Языки СНГ → русский
    const RUSSIAN_LANGS = ['ru', 'uk', 'be', 'kk', 'uz', 'ky', 'tg', 'hy', 'az', 'ka', 'mo', 'tk'];
    if (RUSSIAN_LANGS.includes(lang)) {
        lang = 'ru';
    }
    // Турецкий → турецкий (уже есть)
    else if (lang === 'tr') {
        lang = 'tr';
    }
    // ❗ ВСЕ ОСТАЛЬНЫЕ ЯЗЫКИ → АНГЛИЙСКИЙ
    else {
        lang = 'en';
    }
    
    const textObj = SCROLLS_TEXT[id];
    if (!textObj) {
        // Заглушка на языке пользователя
        if (lang === 'ru') return '📜 Текст будет добавлен позже.';
        if (lang === 'tr') return '📜 Metin daha sonra eklenecek.';
        return '📜 Text will be added later.'; // английский
    }
    
    // Возвращаем текст на нужном языке
    return textObj[lang] || textObj['en'] || textObj['ru'] || 'Текст не найден';
}
//============================================конец распредления текстов по языкам


// Функция для получения иконки свитка (замок или галочка)
function getScrollIcon(scrollId, playerScore) {    if (isScrollUnlocked(scrollId, playerScore)) {        return '✅'; // Открытый свиток
    } else {        return '🔒'; // Закрытый свиток
    }
}

// Функция для получения общего количества очков (из localStorage + VK Storage)
function getTotalScore() {
    // Сначала проверяем localStorage
    let localScore = parseInt(localStorage.getItem('totalScore') || '0');
    
    // Пытаемся загрузить из VK Storage (если есть)
    if (typeof loadFromVKStorage === 'function') {
        // Асинхронно, но для синхронной работы используем localStorage
        // VK Storage уже синхронизирован через loadAllDataFromVK()
        // Поэтому просто используем localStorage
        return localScore;
    }
    return localScore;
}
function isScrollUnlocked(scrollId, playerScore) {
    // Используем максимум из текущих очков и сохранённых (уже синхронизированных)
    const totalScore = Math.max(playerScore || 0, getTotalScore());
    
    // 🔥 ДОБАВЛЯЕМ ПРОВЕРКУ: если свиток уже открыт в VK Storage
    if (typeof getScrollsProgressWithSync === 'function') {
        const progress = getScrollsProgressWithSync();
        if (progress[scrollId]) {
            return true; // Уже открыт, не важно сколько очков
        }
    }
    
    if (scrollId <= 50) {
        return totalScore >= scrollId * 100;
    } else {
        const baseScore = 50 * 100;
        const additional = (scrollId - 50) * 300;
        return totalScore >= baseScore + additional;
    }
}
// Функция подсчёта открытых свитков (с учётом синхронизации)
function countUnlockedScrolls(playerScore) {
    let count = 0;
    
    // 🔥 ПРОВЕРЯЕМ VK STORAGE ПРОГРЕСС
    let vkProgress = {};
    if (typeof getScrollsProgressWithSync === 'function') {
        vkProgress = getScrollsProgressWithSync();
    }
    
    for (let i = 1; i <= 100; i++) {
        // Если свиток уже открыт в VK Storage — считаем
        if (vkProgress[i]) {
            count++;
            continue;
        }
        // Иначе проверяем по очкам
        if (isScrollUnlocked(i, playerScore)) {
            count++;
        }
    }
    return count;
}
// Функция открытия свитка с синхронизацией
function claimScrollWithSync(scrollId) {
    const progress = getScrollsProgressWithSync ? getScrollsProgressWithSync() : {};
    if (progress[scrollId]) return false;
    
    progress[scrollId] = true;
    localStorage.setItem('scrollsProgress', JSON.stringify(progress));
    
    if (typeof saveToVKStorage === 'function') {
        saveToVKStorage('tetris_scrolls_v1', progress);
    }
    
    console.log(`📜 Свиток ${scrollId} открыт и синхронизирован`);
    return true;
}

function getScrollsProgressWithSync() {
    const localProgress = JSON.parse(localStorage.getItem('scrollsProgress') || '{}');
    if (typeof window.vkScrollsProgress !== 'undefined') {
        const merged = { ...localProgress };
        for (const key in window.vkScrollsProgress) {
            if (window.vkScrollsProgress[key] && !merged[key]) {
                merged[key] = true;
            }
        }
        return merged;
    }
    return localProgress;
}

// ======================== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ========================
window.getScrollText = getScrollText;
window.isScrollUnlocked = isScrollUnlocked;
window.getScrollIcon = getScrollIcon;
window.countUnlockedScrolls = countUnlockedScrolls;
window.getTotalScore = getTotalScore;
window.SCROLLS_TEXT = SCROLLS_TEXT;
window.claimScrollWithSync = claimScrollWithSync;
window.getScrollsProgressWithSync = getScrollsProgressWithSync;