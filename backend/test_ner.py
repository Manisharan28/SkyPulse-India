from ml.location_ner import extract_location
import sys

text1 = "Maldives pledges MVR 1M to Nepal PM’s Disaster Relief Fund to support flood recovery"
text2 = "A large landslide has partially blocked the Chaulani River in Nepal's Api Himal Rural Municipality, Darchula District"

print("T1:", extract_location(text1))
print("T2:", extract_location(text2))
