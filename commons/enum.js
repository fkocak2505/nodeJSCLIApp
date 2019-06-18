global.DocTypeEnum = {
    CS_EDOC_BANKRECEIPT: "RECEIPT",
    CS_EDOC_OTHER: "NONE",
    CS_EDOC_INVOICE: "INVOICE",
    CS_EDOC_FLIGHT_TICKET: "TICKET.FLIGHT",
    CS_EDOC_TICKET: "TICKET",
    CS_EDOC_BUS_TICKET: "TICKET.BUS",
    CS_EDOC_EVENT_TICKET: "TICKET.EVENT",
    CS_EDOC_NOT_KNOWN: "UNKNOWN",
    CS_EDOC_POLICY: "POLICY",
    CS_EDOC_CCE: "CCS",
}

//================================================================
global.TablePrimaryKey = {
    GOLGI_USER: "userID",
    GOLGI_ACCOUNT: "accountID",
    GOLGI_DOC: "itemID"
}

//================================================================
global.GolgiUserTableData = [{
    "userID": "",
    "adSoyad": "Fatih Koçak",
    "eposta": "fatihkocak@finanskutusu.com",
    "sifre": "123",
    "tckn": "12312312312",
    "durum": "Approved",
    "kayitTarihi": ""
}, {
    "userID": "",
    "adSoyad": "Onur Dayıbaşı",
    "eposta": "onurdayibasi@finanskutusu.com",
    "sifre": "123",
    "tckn": "32132132123",
    "durum": "Approved",
    "kayitTarihi": ""
}, {
    "userID": "",
    "adSoyad": "Devrim Çavuşoğlu",
    "eposta": "devrimcavusoglu@finanskutusu.com",
    "sifre": "123",
    "tckn": "32132132123",
    "durum": "Approved",
    "kayitTarihi": ""
}, {
    "userID": "",
    "adSoyad": "Banu Korkmaz",
    "eposta": "banukorkmaz@finanskutusu.com",
    "sifre": "123",
    "tckn": "32132132123",
    "durum": "Approved",
    "kayitTarihi": ""
}, {
    "userID": "",
    "adSoyad": "Test User",
    "eposta": "testuser@finanskutusu.com",
    "sifre": "123",
    "tckn": "32132132123",
    "durum": "Approved",
    "kayitTarihi": ""
}]

//================================================================
global.GolgiAccountTableData = [{
    "accountID": "",
    "email": "fatihkocak@finanskutusu.com",
    "permission": {},
    "favorites": "",
    "actions": {},
    "checkOpDate": ""
}, {
    "accountID": "",
    "email": "onurdayibasi@finanskutusu.com",
    "permission": {},
    "favorites": "",
    "actions": {},
    "checkOpDate": ""
}, {
    "accountID": "",
    "email": "devrimcavusoglu@finanskutusu.com",
    "permission": {},
    "favorites": "",
    "actions": {},
    "checkOpDate": ""
}, {
    "accountID": "",
    "email": "orhunturan@finanskutusu.com",
    "permission": {},
    "favorites": "",
    "actions": {},
    "checkOpDate": ""
}, {
    "accountID": "",
    "email": "banukorkmaz@finanskutusu.com",
    "permission": {},
    "favorites": "",
    "actions": {},
    "checkOpDate": ""
}, {
    "accountID": "",
    "email": "testuser@finanskutusu.com",
    "permission": {},
    "favorites": "",
    "actions": {},
    "checkOpDate": ""
}]

//================================================================
global.ViewMenuObj = {
    viewMenuNameArr: [{
        "titleName": "e-Arşiv Fatura",
        "selected": "",
        "imageID": "eArsiv"
    }, {
        "titleName": "Dekont",
        "selected": "",
        "imageID": "dekont"
    }, {
        "titleName": "Poliçe",
        "selected": "",
        "imageID": "police"
    }, {
        "titleName": "Kredi Kartı Ekstresi",
        "selected": "",
        "imageID": "kke"
    }, {
        "titleName": "Elektrik Abonelikleri",
        "selected": "",
        "imageID": "elektrik"
    }, {
        "titleName": "Su Abonelikleri",
        "selected": "",
        "imageID": "su"
    }, {
        "titleName": "Akaryakıt",
        "selected": "",
        "imageID": "akaryakit"
    }, {
        "titleName": "HGS / OGS",
        "selected": "",
        "imageID": "hgs"
    }, {
        "titleName": "Uçak Bileti",
        "selected": "",
        "imageID": "ucak"
    }, {
        "titleName": "Tren Bileti",
        "selected": "",
        "imageID": "tren"
    }, {
        "titleName": "Otobüs / Vapur Bileti",
        "selected": "",
        "imageID": "otobus"
    }, {
        "titleName": "Maç Bileti",
        "selected": "",
        "imageID": "mac"
    }, {
        "titleName": "Etkinlik Bileti",
        "selected": "",
        "imageID": "etkinlik"
    }, {
        "titleName": "Sinema Bileti",
        "selected": "",
        "imageID": "sinema"
    }, {
        "titleName": "Tiyatro Bileti",
        "selected": "",
        "imageID": "tiyatro"
    }, {
        "titleName": "Bulut Abonelikleri",
        "selected": "",
        "imageID": "bulut"
    }, {
        "titleName": "ÖSYM Sınav Belgeleri",
        "selected": "",
        "imageID": "osym"
    }, {
        "titleName": "Doğalgaz Abonelikleri",
        "selected": "",
        "imageID": "dogalgaz"
    }, {
        "titleName": "Spor",
        "selected": "",
        "imageID": "spor"
    }, {
        "titleName": "Sağlık",
        "selected": "",
        "imageID": "saglik"
    }]
};