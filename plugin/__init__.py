__description__ = "BLE Monitor plugin"

from objection.utils.plugin import Plugin
import os


class BLEInfo(Plugin):
    """ BLEInfo is a plugin to monitor basic BLE data exchanges"""

    def __init__(self, ns):
        """
            Creates a new instance of the plugin

            :param ns:
        """

        # plugin sources are specified, so when the plugin is loaded it will not
        # try and discover an index.js next to this file.
        #self.script_src = s

        # as script_src is specified, a path is not necessary. this is simply an
        # example of an alternate method to load a Frida script
        self.script_path = os.path.join(os.path.dirname(__file__), "script.js")

        implementation = {
            'meta': 'Monitor BLE reads and writes to a peripherals chracteristics',
            'commands': {
                'monitor': {
                    'meta': 'Monitor BLE read/write/notifications',
                    'exec': self.monitorBLE
                }
            }
        }

        super().__init__(__file__, ns, implementation)

        self.inject()

    def monitorBLE(self, args: list):
        """
            :param args:
            :return:
        """
        # camelCase in JS results in lowercase with underscores:
        # https://github.com/frida/frida-python/issues/104
        v = self.api.monitor_ble()


namespace = 'ble'
plugin = BLEInfo
