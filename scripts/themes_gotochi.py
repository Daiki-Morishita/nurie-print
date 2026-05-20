# =============================================
# ご当地ぬりえ テーマ統合ファイル
# 47都道府県・約500アイテム
# 各アイテムはnormal 1枚のみ
# =============================================

from themes_gotochi_p1 import GOTOCHI_P1
from themes_gotochi_p2 import GOTOCHI_P2
from themes_gotochi_p3 import GOTOCHI_P3
from themes_gotochi_p4 import GOTOCHI_P4
from themes_gotochi_p5 import GOTOCHI_P5
from themes_gotochi_p6 import GOTOCHI_P6

GOTOCHI_ITEMS = {
    **GOTOCHI_P1,  # 北海道・東北
    **GOTOCHI_P2,  # 関東
    **GOTOCHI_P3,  # 中部
    **GOTOCHI_P4,  # 近畿
    **GOTOCHI_P5,  # 中国・四国
    **GOTOCHI_P6,  # 九州・沖縄
}
